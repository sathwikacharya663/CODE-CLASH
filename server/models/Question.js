const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  points: { type: Number, default: 0 },
}, { _id: false });

const codeMapSchema = new mongoose.Schema({
  python: { type: String, default: '' },
  c: { type: String, default: '' },
  cpp: { type: String, default: '' },
  java: { type: String, default: '' },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  round: { type: Number, required: true, enum: [1, 2, 3] },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  inputFormat: { type: String, default: '' },
  outputFormat: { type: String, default: '' },
  constraints: { type: String, default: '' },
  sampleInput: { type: String, default: '' },
  sampleOutput: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  buggyCode: { type: codeMapSchema, default: () => ({}) },
  starterCode: { type: codeMapSchema, default: () => ({}) },
  testCases: { type: [testCaseSchema], default: [] },
  totalPoints: { type: Number, required: true, default: 100 },
  timeBonusEnabled: { type: Boolean, default: false },
  penaltyPerWrongSubmission: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
