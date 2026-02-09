import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import useFetch from "@/hooks/useFetch";

enum IssueStatus {
    REPORTED = 'reported',
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    DONE = 'done'
}

enum IssueSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

interface Issue {
    id: string;
    vehicleId: string;
    vehicleName?: string;
    driverId: string;
    tourId: string | null;
    severity: IssueSeverity;
    description: string;
    status: IssueStatus;
    imageUrl?: string;
    reportedAt: string;
    createdAt: string;
    updatedAt: string;
}

export default function IssuesScreen() {
    const router = useRouter();
    const { user, assignedTask, setAssignedTask } = useAuth();
    const { fetchData } = useFetch();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

    const [newIssue, setNewIssue] = useState({
        description: '',
        severity: IssueSeverity.MEDIUM
    });

    const loadIssues = async () => {
        try {
            const response = await api.getIssues();
            if (response.success && response.data?.data && Array.isArray(response.data.data)) {
                setIssues(response.data.data);
            } else {
                console.warn('[Issues] Invalid data format received:', response.data);
                setIssues([]);
            }
        } catch (err) {
            console.error('[Issues] Error loading issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAssignedTask = async () => {
        if (assignedTask) return;
        try {
            const response = await fetchData({ endPoint: '/get-assigned-task', method: 'POST' });
            if (response && response.data) {
                setAssignedTask(response.data);
                console.log('[Issues] Assigned task recovered:', response.data);
            }
        } catch (error) {
            console.error('[Issues] Error recovering assigned task:', error);
        }
    };

    useEffect(() => {
        loadIssues();
        loadAssignedTask();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadIssues();
        setRefreshing(false);
    };

    const [submitting, setSubmitting] = useState(false);

    const handleCreateIssue = async () => {
        console.log('[Issues] handleCreateIssue called');
        if (!newIssue.description.trim()) {
            console.log('[Issues] Missing description');
            Alert.alert('Error', 'Please provide a description');
            return;
        }

        console.log('[Issues] Assigned task:', assignedTask);
        if (!assignedTask?.vehicle?.id) {
            console.log('[Issues] No vehicle ID found in assignedTask');
            Alert.alert('Error', 'No vehicle associated with your current task. Please ensure you have an assigned vehicle.');
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                vehicleId: assignedTask.vehicle.id,
                severity: newIssue.severity,
                description: newIssue.description,
                tourId: assignedTask.tour?.id || null
            };
            console.log('[Issues] Submitting to API:', body);

            const response = await api.createIssue(body);
            console.log('[Issues] API Response:', response);
            if (response.success) {
                Alert.alert('Success', 'Issue reported successfully');
                setIsModalOpen(false);
                setNewIssue({ description: '', severity: IssueSeverity.MEDIUM });
                loadIssues();
            } else {
                console.error('[Issues] Submission failed:', response.error);
                Alert.alert('Error', response.error || 'Failed to report issue');
            }
        } catch (err) {
            console.error('[Issues] Unexpected error:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: IssueStatus) => {
        switch (status) {
            case IssueStatus.REPORTED: return colors.warning;
            case IssueStatus.SCHEDULED: return colors.primary;
            case IssueStatus.IN_PROGRESS: return colors.secondary;
            case IssueStatus.DONE: return '#4CAF50';
            default: return colors.textSecondary;
        }
    };

    const getSeverityColor = (severity: IssueSeverity) => {
        switch (severity) {
            case IssueSeverity.HIGH: return '#f44336';
            case IssueSeverity.MEDIUM: return '#FF9800';
            case IssueSeverity.LOW: return '#2196F3';
            default: return colors.textSecondary;
        }
    };

    const filteredIssues = issues.filter(issue =>
        activeTab === 'active' ? issue.status !== IssueStatus.DONE : issue.status === IssueStatus.DONE
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Vehicle Issues',
                    headerBackTitle: 'Back',
                }}
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
                    onPress={() => setActiveTab('closed')}
                >
                    <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>Closed</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : filteredIssues.length === 0 ? (
                    <View style={styles.centerBox}>
                        <IconSymbol name="wrench.and.screwdriver" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No {activeTab} issues found</Text>
                    </View>
                ) : (
                    filteredIssues.map(issue => (
                        <View key={issue.id} style={styles.issueCard}>
                            <View style={styles.issueHeader}>
                                <View style={[styles.badge, { backgroundColor: getSeverityColor(issue.severity) }]}>
                                    <Text style={styles.badgeText}>{issue.severity.toUpperCase()}</Text>
                                </View>
                                <View style={[styles.statusBadge, { borderColor: getStatusColor(issue.status) }]}>
                                    <Text style={[styles.statusBadgeText, { color: getStatusColor(issue.status) }]}>
                                        {issue.status.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.issueDesc}>{issue.description}</Text>
                            <Text style={styles.issueDate}>
                                Reported: {new Date(issue.reportedAt || issue.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[buttonStyles.primary, styles.reportButton]}
                    onPress={() => setIsModalOpen(true)}
                >
                    <IconSymbol name="plus" size={20} color="#fff" />
                    <Text style={buttonStyles.text}>Report New Issue</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Report Vehicle Issue</Text>

                        <Text style={styles.label}>Severity</Text>
                        <View style={styles.severityContainer}>
                            {Object.values(IssueSeverity).map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.severityOption,
                                        newIssue.severity === s && { backgroundColor: getSeverityColor(s) }
                                    ]}
                                    onPress={() => setNewIssue({ ...newIssue, severity: s })}
                                >
                                    <Text style={[
                                        styles.severityText,
                                        newIssue.severity === s && { color: '#fff' }
                                    ]}>{s.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe the issue..."
                            value={newIssue.description}
                            onChangeText={(text) => setNewIssue({ ...newIssue, description: text })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsModalOpen(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitButton, submitting && { opacity: 0.7 }]}
                                onPress={handleCreateIssue}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.primary + '10',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
    },
    scrollView: {
        flex: 1,
    },
    centerBox: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
    },
    issueCard: {
        backgroundColor: colors.card,
        margin: 16,
        marginBottom: 0,
        padding: 16,
        borderRadius: 12,
        ...commonStyles.shadow,
    },
    issueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    issueDesc: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 20,
        marginBottom: 12,
    },
    issueDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    footer: {
        padding: 16,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    severityContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    severityOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    severityText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        fontWeight: '600',
        color: colors.text,
    },
    submitButton: {
        backgroundColor: colors.primary,
    },
    submitButtonText: {
        fontWeight: '600',
        color: '#fff',
    },
});
