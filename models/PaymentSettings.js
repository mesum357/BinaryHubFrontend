const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema(
  {
    easypaisaNumber: { type: String, default: '' },
    easypaisaAccountTitle: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankAccountTitle: { type: String, default: '' },
    bankIban: { type: String, default: '' },
    additionalBankNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
