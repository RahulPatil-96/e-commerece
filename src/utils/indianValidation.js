// India-specific validation utilities
export const indianPhoneRegex = /^\d{10}$/;
export const indianPincodeRegex = /^\d{6}$/;
export const indianGSTRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z\d{1}$/;

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli',
  'Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function validateIndianPhone(phone) {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  if (!indianPhoneRegex.test(phone)) {
    return { valid: false, error: 'Phone must be 10 digits' };
  }
  return { valid: true };
}

export function validateIndianPincode(pincode) {
  if (!pincode) return { valid: false, error: 'Pincode is required' };
  if (!indianPincodeRegex.test(pincode)) {
    return { valid: false, error: 'Pincode must be 6 digits' };
  }
  return { valid: true };
}

export function validateIndianGST(gst) {
  if (!gst) return { valid: true }; // Optional
  if (!indianGSTRegex.test(gst)) {
    return { valid: false, error: 'Invalid GST number format' };
  }
  return { valid: true };
}

export function validateShippingDetails(details) {
  const errors = {};

  if (!details.customer_name?.trim()) errors.customer_name = 'Name is required';
  if (!details.email?.trim()) errors.email = 'Email is required';
  if (!details.address?.trim()) errors.address = 'Address is required';
  if (!details.city?.trim()) errors.city = 'City is required';
  if (!details.state) errors.state = 'State is required';

  const phoneValidation = validateIndianPhone(details.phone);
  if (!phoneValidation.valid) errors.phone = phoneValidation.error;

  const pincodeValidation = validateIndianPincode(details.pincode);
  if (!pincodeValidation.valid) errors.pincode = pincodeValidation.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
