const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trends: {
    type: [String],
    required: true,
    validate: {
      validator: function(trends) {
        return trends.length === 5;
      },
      message: 'Trends array must contain exactly 5 items'
    }
  },
  ipAddress: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'trends'
});
trendSchema.index({ createdAt: -1 });


trendSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});


trendSchema.set('toJSON', { virtuals: true });
trendSchema.set('toObject', { virtuals: true });


trendSchema.statics.getLatestTrends = function(limit = 5) {
  return this.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};


trendSchema.methods.getSummary = function() {
  return {
    runId: this.runId,
    trendCount: this.trends.length,
    ipAddress: this.ipAddress,
    createdAt: this.createdAt
  };
};

const Trend = mongoose.model('Trend', trendSchema);

module.exports = Trend;
