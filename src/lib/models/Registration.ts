import mongoose, { Schema, Document, Model } from "mongoose";

export const HOUSES = ["FIRE", "WATER", "WIND", "ICE"] as const;
export type House = (typeof HOUSES)[number];

export interface IRegistration extends Document {
  firstName: string;
  surname: string;
  dob: { day: number; month: number; year: number };
  sex: "Male" | "Female";
  churchName: string;
  country: string;
  state: string;
  hobbies: string;
  contactPhone: string;
  email: string;
  education: "Secondary School" | "University" | "Graduate" | "Working";
  healthConditions: string;
  house: House;
  registeredAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    firstName: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    dob: {
      day: { type: Number, required: true },
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    sex: { type: String, enum: ["Male", "Female"], required: true },
    churchName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    hobbies: { type: String, trim: true, default: "" },
    contactPhone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    education: {
      type: String,
      enum: ["Secondary School", "University", "Graduate", "Working"],
      required: true,
    },
    healthConditions: { type: String, trim: true, default: "None" },
    house: { type: String, enum: HOUSES, required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
