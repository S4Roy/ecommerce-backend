import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const TokenSchema = new Schema({
  provider: {
    type: String,
    required: true,
    unique: true,
  },
  client_id: {
    type: String,
    required: true,
  },
  client_secret: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: true,
  },
  access_token: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: Types.ObjectId,
    default: null,
  },
  updated_at: {
    type: Date,
    default: null,
  },

  updated_by: {
    type: Types.ObjectId,
    default: null,
  },
  expires_at: {
    type: Date,
    default: null,
  },
});

const Token = model("tokens", TokenSchema);

export default Token;
