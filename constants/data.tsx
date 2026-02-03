export type CheckListType = {
  description:string
  excluding:string
  frequency:string
  id:number
  index:number
  item:string
  itemType:string | number | "YesNo"
  optional: boolean
}
export const itemlistTypes:CheckListType[] = [
  {
    "description": "Enter value AND upload photo of dashboard Km",
    "excluding": "Never",
    "frequency": "Always",
    "id": 57,
    "index": 1000,
    "item": "Odometer reading",
    "itemType": "Number",
    "optional": false
  },
  {
    "description": "Sealed and gauge in green",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 58,
    "index": 2000,
    "item": "Fire Extinguisher",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 59,
    "index": 3000,
    "item": "PA system",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 60,
    "index": 4000,
    "item": "Aircon",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 61,
    "index": 5000,
    "item": "Fridge",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working and loaded ",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 62,
    "index": 6000,
    "item": "WiFi",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Not damaged and working, reclining, armrests working",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 63,
    "index": 7000,
    "item": "Seats",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "No damaged magazine nets",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 64,
    "index": 8000,
    "item": "Magazine nets",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Inspected",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 65,
    "index": 9000,
    "item": "Parcel shelves",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Clean and working",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 66,
    "index": 10000,
    "item": "Lights and vents",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All safety belts working",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 67,
    "index": 11000,
    "item": "All safety belts working",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Filled",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 68,
    "index": 12000,
    "item": "Water canisters",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All working",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 69,
    "index": 13000,
    "item": "Internal lights",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Not damaged and working, reclining, armrests working",
    "excluding": "TourStarts, TourEnds",
    "frequency": "Always",
    "id": 70,
    "index": 14000,
    "item": "Seats",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Bus , includung floor and windows, all clean",
    "excluding": "TourStarts, TourEnds",
    "frequency": "Always",
    "id": 71,
    "index": 15000,
    "item": "Clean Bus",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Enough",
    "excluding": "TourStarts, TourEnds",
    "frequency": "Always",
    "id": 72,
    "index": 16000,
    "item": "Drinking Water",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Is sprayed",
    "excluding": "TourStarts, TourEnds",
    "frequency": "Always",
    "id": 73,
    "index": 17000,
    "item": "Sanitizer",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Front and rear working",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 74,
    "index": 18000,
    "item": "Outside lights",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Level checked",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 75,
    "index": 19000,
    "item": "Oil",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Level checked",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 76,
    "index": 20000,
    "item": "Anti-freeze",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Level checked",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 77,
    "index": 21000,
    "item": "Brake fluid",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Level checked",
    "excluding": "TourEnds",
    "frequency": "Always",
    "id": 78,
    "index": 22000,
    "item": "Power steering oil",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All doors closing and locking properly",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 79,
    "index": 23000,
    "item": "Doors",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working and clean",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 80,
    "index": 24000,
    "item": "Sliding window",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working and clean",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 81,
    "index": 25000,
    "item": "Front Windows",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Working",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 82,
    "index": 26000,
    "item": "Reverse camera",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All working",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 83,
    "index": 27000,
    "item": "Side mirrors",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Clean and has no running cracks",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 84,
    "index": 28000,
    "item": "Windscreen",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All in good condition",
    "excluding": "Never",
    "frequency": "TourStarts",
    "id": 85,
    "index": 29000,
    "item": "Tyres",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "All correct",
    "excluding": "Never",
    "frequency": "Always",
    "id": 86,
    "index": 30000,
    "item": "Tyre pressures",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Report any other exceptions",
    "excluding": "TourStarts, TourEnds",
    "frequency": "Always",
    "id": 87,
    "index": 43000,
    "item": "Other",
    "itemType": "String",
    "optional": true
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 88,
    "index": 32000,
    "item": "Tyre tread Left front",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 89,
    "index": 33000,
    "item": "Tyre tread Right front",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 90,
    "index": 34000,
    "item": "Tyre tread Left rear inner ",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 91,
    "index": 35000,
    "item": "Tyre tread Left rear outer",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 92,
    "index": 36000,
    "item": "Tyre tread Right rear inner ",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 93,
    "index": 37000,
    "item": "Tyre tread Right rear outer",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "All lights and fittings working",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 94,
    "index": 38000,
    "item": "Trailer lights and fittings",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Padlocks checked",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 95,
    "index": 39000,
    "item": "Trailer Padlocks",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Pressures correct",
    "excluding": "Never",
    "frequency": "Always",
    "id": 96,
    "index": 40000,
    "item": "Trailer Tyre pressures",
    "itemType": "YesNo",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 97,
    "index": 41000,
    "item": "Trailer Tyre tread Rigth",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "Depth in mm",
    "excluding": "Never",
    "frequency": "TourStarts, TourEnds",
    "id": 98,
    "index": 42000,
    "item": "Trailer Tyre tread Left",
    "itemType": "Integer",
    "optional": false
  },
  {
    "description": "ALL wheel nuts checked and tight",
    "excluding": "Never",
    "frequency": "Always",
    "id": 99,
    "index": 1500,
    "item": "Wheel nuts",
    "itemType": "YesNo",
    "optional": false
  }
]






const items = [
  {
    "inspectionItem": 57,
    "value": 125000,
    "attachments": [
      { "remark": "Odometer reading", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 58,
    "value": "Yes",
    "attachments": [
      { "remark": "Fire extinguisher OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 59,
    "value": "Yes",
    "attachments": [
      { "remark": "PA working", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 60,
    "value": "Yes",
    "attachments": [
      { "remark": "Aircon tested", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 61,
    "value": "Yes",
    "attachments": [
      { "remark": "Fridge cold", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 62,
    "value": "Yes",
    "attachments": [
      { "remark": "WiFi ok", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 63,
    "value": "Yes",
    "attachments": [
      { "remark": "Seats checked", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 64,
    "value": "Yes",
    "attachments": [
      { "remark": "Magazine nets ok", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 65,
    "value": "Yes",
    "attachments": [
      { "remark": "Parcel shelves ok", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 66,
    "value": "Yes",
    "attachments": [
      { "remark": "Lights & vents working", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 67,
    "value": "Yes",
    "attachments": [
      { "remark": "Belts checked", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 68,
    "value": "Yes",
    "attachments": [
      { "remark": "Water canisters filled", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 69,
    "value": "Yes",
    "attachments": [
      { "remark": "Internal lights working", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 70,
    "value": "Yes",
    "attachments": [
      { "remark": "Seats checked", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 71,
    "value": "Yes",
    "attachments": [
      { "remark": "Bus is clean", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 72,
    "value": "Yes",
    "attachments": [
      { "remark": "Drinking water enough", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 73,
    "value": "Yes",
    "attachments": [
      { "remark": "Sanitizer sprayed", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 74,
    "value": "Yes",
    "attachments": [
      { "remark": "Outside lights OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 75,
    "value": "Yes",
    "attachments": [
      { "remark": "Oil checked", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 76,
    "value": "Yes",
    "attachments": [
      { "remark": "Anti-freeze level OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 77,
    "value": "Yes",
    "attachments": [
      { "remark": "Brake fluid OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 78,
    "value": "Yes",
    "attachments": [
      { "remark": "Power steering OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 79,
    "value": "Yes",
    "attachments": [
      { "remark": "Doors working", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 80,
    "value": "Yes",
    "attachments": [
      { "remark": "Sliding window OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 81,
    "value": "Yes",
    "attachments": [
      { "remark": "Front windows OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 82,
    "value": "Yes",
    "attachments": [
      { "remark": "Reverse camera OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 83,
    "value": "Yes",
    "attachments": [
      { "remark": "Mirrors OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 84,
    "value": "Yes",
    "attachments": [
      { "remark": "Windscreen clean", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 85,
    "value": "Yes",
    "attachments": [
      { "remark": "Tyres good", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 86,
    "value": "Yes",
    "attachments": [
      { "remark": "Tyre pressures correct", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 88,
    "value": "8",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 89,
    "value": "7",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 90,
    "value": "6",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 91,
    "value": "6",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 92,
    "value": "7",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 93,
    "value": "7",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 94,
    "value": "Yes",
    "attachments": [
      { "remark": "Trailer lights OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 95,
    "value": "Yes",
    "attachments": [
      { "remark": "Padlocks OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 96,
    "value": "Yes",
    "attachments": [
      { "remark": "Trailer tyre pressure OK", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 97,
    "value": "5",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 98,
    "value": "5",
    "attachments": [
      { "remark": "Tread measured", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 99,
    "value": "Yes",
    "attachments": [
      { "remark": "Wheel nuts tight", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  },
  {
    "inspectionItem": 87,
    "value": "No exceptions",
    "attachments": [
      { "remark": "General check", "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." }
    ]
  }
]

const date = new Date().toISOString();

export const mock_body = {
    inspectionId: 3,
    tourId: null,
    date,
    items,
    attachments: [],
};
const x = {"attachments": [], "date": "2025-11-28T08:12:36.710Z", "inspectionId": 2, "items": [{"attachment": "data:image/jpeg;base64,", "inspectionItemId": 48, "value": "50000"}, {"attachment": null, "inspectionItemId": 49, "value": "5"}, {"attachment": null, "inspectionItemId": 50, "value": "5"}, {"attachment": null, "inspectionItemId": 51, "value": "5"}, {"attachment": null, "inspectionItemId": 52, "value": "5"}, {"attachment": null, "inspectionItemId": 53, "value": "5"}, {"attachment": null, "inspectionItemId": 54, "value": "5"}, {"attachment": null, "inspectionItemId": 55, "value": "5"}, {"attachment": null, "inspectionItemId": 56, "value": "5"}], "tourId": null} 