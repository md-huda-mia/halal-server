const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    title: { type: String, require: true },
    category: {
      type: String,
      enum: [
        "App Developer",
        "Web Developer",
        "Business",
        "Seo Expart",
        "Education",
        "Junior Web Developer",
        "Designer",
        "Investment",
      ],
      message: "{value is not supported}",
    },
    description: { type: String, require: true },
    location: { type: String, require: true },
    thumbnail: { type: String, require: true },
    jobCategory: { type: String, enum: ["Full Time", "Part Time", "Remote"] },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
module.exports = model("Post", postSchema);
