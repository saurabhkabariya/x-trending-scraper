const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Trend = require('../models/Trend');
const TwitterScraper = require('../scraper/TwitterScraper');

const router = express.Router();

router.post('/scrape', async (req, res) => {
  let scraper = null;
  
  try {
    console.log('Starting new scraping session...');
    
    if (!process.env.X_USERNAME || !process.env.X_PASSWORD) {
      return res.status(400).json({
        error: 'Configuration Error',
        message: 'credentials not configured. Please check X_USERNAME and X_PASSWORD environment variables.'
      });
    }
    
    const runId = uuidv4();
    console.log(`Generated run ID: ${runId}`);
    
    scraper = new TwitterScraper();
    const { trends, ipAddress } = await scraper.scrape();
    
    const trendRecord = new Trend({
      runId,
      trends,
      ipAddress,
      createdAt: new Date()
    });
    
    const savedRecord = await trendRecord.save();
    console.log('Trends saved to database:', savedRecord._id);
    
    res.status(201).json({
      success: true,
      message: 'Trending topics scraped successfully',
      data: {
        runId: savedRecord.runId,
        trends: savedRecord.trends,
        ipAddress: savedRecord.ipAddress,
        createdAt: savedRecord.createdAt,
        id: savedRecord._id
      }
    });
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error during scraping';
    
    if (error.message.includes('login')) {
      statusCode = 401;
      errorMessage = 'Authentication failed. Please check X credentials.';
    } else if (error.message.includes('WebDriver')) {
      statusCode = 500;
      errorMessage = 'Browser automation error. Please try again.';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = 'Data validation error.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  } finally {
    if (scraper) {
      await scraper.close();
    }
  }
});

router.get('/trends', async (req, res) => {
  try {
    console.log('Fetching latest trends...');
    
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    
    const trends = await Trend.getLatestTrends(limit);
    
    console.log(`Retrieved ${trends.length} trend records`);
    
    res.status(200).json({
      success: true,
      message: `Retrieved ${trends.length} latest trend records`,
      data: trends,
      meta: {
        count: trends.length,
        limit,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching trends:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends from database',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

router.get('/trends/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    
    console.log(`Fetching trend record for runId: ${runId}`);
    
    const trend = await Trend.findOne({ runId }).select('-__v');
    
    if (!trend) {
      return res.status(404).json({
        success: false,
        error: 'Trend record not found',
        message: `No trend record found with runId: ${runId}`
      });
    }
    
    console.log('Retrieved trend record:', trend._id);
    
    res.status(200).json({
      success: true,
      message: 'Trend record retrieved successfully',
      data: trend
    });
    
  } catch (error) {
    console.error('Error fetching trend by runId:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend record',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching database statistics...');
    
    const totalRecords = await Trend.countDocuments();
    const latestRecord = await Trend.findOne().sort({ createdAt: -1 });
    const oldestRecord = await Trend.findOne().sort({ createdAt: 1 });
    
    const stats = {
      totalRecords,
      latestRun: latestRecord ? {
        runId: latestRecord.runId,
        createdAt: latestRecord.createdAt
      } : null,
      oldestRun: oldestRecord ? {
        runId: oldestRecord.runId,
        createdAt: oldestRecord.createdAt
      } : null,
      generatedAt: new Date().toISOString()
    };
    
    console.log('Retrieved database statistics');
    
    res.status(200).json({
      success: true,
      message: 'Database statistics retrieved successfully',
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

module.exports = router;
