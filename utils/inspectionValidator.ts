export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateInspection = (type: string, data: any): ValidationResult => {
  const errors: string[] = [];

  // Common validations
  if (!data.odometerReading?.trim()) {
    errors.push('Odometer reading is required');
  } else {
    const value = parseInt(data.odometerReading, 10);
    if (isNaN(value) || value < 0) {
      errors.push('Invalid odometer reading');
    }
  }

  if (!data.odometerPhoto) {
    errors.push('Odometer photo is required');
  }

  if (type === 'morning' || type === 'evening') {
    // Check all items have values
    const incomplete = data.checkItems.filter((item: any) => !item.value || item.value.trim() === '');
    if (incomplete.length > 0) {
      errors.push(`All checklist items must be completed. Missing: ${incomplete.length}`);
    }

    // Oil photo
    const oilItem = data.checkItems.find((item: any) => item.id === '11');
    if (oilItem?.checked && !oilItem.photoBase64) {
      errors.push('Oil level photo is required');
    }
  } else if (type === 'pre-tour') {
    // Check all items checked
    const unchecked = data.checklist.filter((item: any) => !item.checked);
    if (unchecked.length > 0) {
      errors.push(`All checklist items must be completed. Missing: ${unchecked.length}`);
    }

    // Oil photo
    const oilItem = data.checklist.find((item: any) => item.id === '13');
    if (!oilItem?.photoBase64) {
      errors.push('Oil level photo is required');
    }

    // Tyres
    const emptyTyres = data.tyres.filter((t: any) => !t.depth);
    if (emptyTyres.length > 0) {
      errors.push('All tyre tread depths must be entered');
    }

    // Trailer if used
    if (data.trailerUsed) {
      const uncheckedTrailer = data.trailerChecklist.filter((item: any) => !item.checked);
      if (uncheckedTrailer.length > 0) {
        errors.push('All trailer checklist items must be completed');
      }

      const emptyTrailerTyres = data.trailerTyres.filter((t: any) => !t.depth);
      if (emptyTrailerTyres.length > 0) {
        errors.push('All trailer tyre tread depths must be entered');
      }
    }
  } else if (type === 'post-tour') {
    if (!data.fuelPhoto) {
      errors.push('Fuel level photo is required');
    }

    const emptyTyres = data.tyreData.filter((t: any) => !t.depth.trim());
    if (emptyTyres.length > 0) {
      errors.push('All tyre tread depths must be entered');
    }

    if (data.trailerUsed) {
      const uncheckedTrailer = data.trailerChecklist.filter((item: any) => !item.checked);
      if (uncheckedTrailer.length > 0) {
        errors.push('All trailer checklist items must be completed');
      }

      const emptyTrailerTyres = data.trailerTyreData.filter((t: any) => !t.depth.trim());
      if (emptyTrailerTyres.length > 0) {
        errors.push('All trailer tyre tread depths must be entered');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};