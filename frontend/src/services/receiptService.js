import api from './api';

export const receiptService = {
  /**
   * Upload a receipt image (uri from expo-image-picker) and get extracted fields.
   * Returns { amount, merchant, date, rawText }
   */
  scanReceipt: async (imageUri) => {
    const filename = imageUri.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();
    formData.append('receipt', { uri: imageUri, name: filename, type: mimeType });

    const response = await api.post('/transactions/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    });
    return response.data;
  },
};
