const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    shortDescription: {
      type: String,
      maxlength: 200,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Classical Music',
        'Folk Dance',
        'Classical Dance',
        'Art Exhibition',
        'Food Festival',
        'Theater & Drama',
        'Craft Fair',
        'Cultural Parade',
        'Literary Festival',
        'Film Festival',
        'Spiritual & Religious',
        'Other',
      ],
    },
    culturalOrigin: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    earlyBirdPrice: {
      type: Number,
    },
    earlyBirdDeadline: {
      type: Date,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    waitlistEnabled: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    performers: [
      {
        name: { type: String },
        role: { type: String },
        bio: { type: String },
        image: { type: String },
      },
    ],
    schedule: [
      {
        time: { type: String },
        activity: { type: String },
        performer: { type: String },
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    highlights: {
      type: [String],
      default: [],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    organizerNote: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
