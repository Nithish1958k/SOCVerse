import mongoose from 'mongoose';

// Simple atomic counter collection for generating human-friendly IDs
// like ALR-00231 / INC-0042 / CASE-0007 without race conditions.
const counterSchema = new mongoose.Schema({
  _id: String, // the prefix, e.g. "ALR"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export async function nextId(prefix, pad = 5) {
  const doc = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${String(doc.seq).padStart(pad, '0')}`;
}
