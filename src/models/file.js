import { Schema, model } from 'mongoose';

const fileSchema = new Schema({
  name: String,
  type: String,
  path: String,
});

export default model('File', fileSchema);
