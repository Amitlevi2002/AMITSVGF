import mongoose, { Schema, Document } from 'mongoose';

export type DesignStatus = 'PENDING' | 'PROCESSED' | 'ERROR';
export type DesignIssue = 'EMPTY' | 'OUT_OF_BOUNDS';

export interface IDesignItem {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  issue?: 'OUT_OF_BOUNDS';
}

export interface IDesign extends Document {
  filename: string;
  filePath: string;
  status: DesignStatus;
  createdAt: Date;
  svgWidth: number;
  svgHeight: number;
  items: IDesignItem[];
  itemsCount: number;
  coverageRatio: number;
  issues: DesignIssue[];
}

const DesignItemSchema = new Schema<IDesignItem>({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  fill: { type: String, required: true },
  issue: { type: String, enum: ['OUT_OF_BOUNDS'] },
});

const DesignSchema = new Schema<IDesign>({
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSED', 'ERROR'],
    default: 'PENDING',
    required: true,
  },
  createdAt: { type: Date, default: Date.now, required: true },
  svgWidth: { type: Number, required: true },
  svgHeight: { type: Number, required: true },
  items: [DesignItemSchema],
  itemsCount: { type: Number, required: true },
  coverageRatio: { type: Number, required: true },
  issues: [{ type: String, enum: ['EMPTY', 'OUT_OF_BOUNDS'] }],
});

export default mongoose.model<IDesign>('Design', DesignSchema);
