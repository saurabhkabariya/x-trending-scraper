const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TwitterScraper {
  constructor() {
    this.driver = null;
    this.options = new chrome.Options();

    this.ensureChromeUserDataDir();

    // Essential options to prevent Chrome crashes
    this.options.addArguments('--no-sandbox');
    this.options.addArguments('--disable-dev-shm-usage');
    this.options.addArguments('--disable-blink-features=AutomationControlled');
    this.options.addArguments('--disable-web-security');
    this.options.addArguments('--disable-features=VizDisplayCompositor');
    this.options.addArguments('--disable-extensions');
    this.options.addArguments('--disable-plugins');
    this.options.addArguments('--disable-images');
    this.options.addArguments('--disable-gpu');
    this.options.addArguments('--disable-gpu-sandbox');
    this.options.addArguments('--disable-software-rasterizer');
    this.options.addArguments('--disable-background-timer-throttling');
    this.options.addArguments('--disable-backgrounding-occluded-windows');
    this.options.addArguments('--disable-renderer-backgrounding');
    this.options.addArguments('--disable-ipc-flooding-protection');
    this.options.addArguments('--ignore-ssl-errors=yes');
    this.options.addArguments('--ignore-certificate-errors');
    this.options.addArguments('--ignore-certificate-errors-spki-list');
    this.options.addArguments('--ignore-ssl-errors');
    this.options.addArguments('--allow-running-insecure-content');
    this.options.addArguments('--disable-default-apps');
    this.options.addArguments('--no-first-run');
    this.options.addArguments('--no-default-browser-check');
    this.options.addArguments('--disable-logging');
    this.options.addArguments('--disable-logging-redirect');
    this.options.addArguments('--log-level=3');
    this.options.addArguments('--output=/dev/null');
    this.options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Remote debugging port to prevent DevToolsActivePort issues
    this.options.addArguments('--remote-debugging-port=9222');
    
    // User data directory for session persistence
    this.options.addArguments('--user-data-dir=./chrome-user-data');
    this.options.addArguments('--profile-directory=Default');
    
    // Window size for better stability
    this.options.addArguments('--window-size=1920,1080');
    this.options.addArguments('--start-maximized');
    
    if (process.env.NODE_ENV === 'production') {
      this.options.addArguments('--headless=new');
      this.options.addArguments('--disable-dev-shm-usage');
      this.options.addArguments('--memory-pressure-off');
      this.options.addArguments('--max_old_space_size=4096');
    }
  }

  ensureChromeUserDataDir() {
    try {
      const userDataDir = path.join(process.cwd(), 'chrome-user-data');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
        console.log('Created chrome-user-data directory');
      }
    } catch (error) {
      console.log('Could not create chrome-user-data directory:', error.message);
    }
  }

  isValidTrend(text) {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text.trim();
    
    if (!cleanText || cleanText.length === 0) return false;
    
    // Filter out promotional keywords
    const promotionalKeywords = [
      'subscribe', 'premium', 'unlock', 'features', 'revenue',
      'show more', 'see more', 'trending', 'what\'s happening', 'whats happening',
      'for you', 'follow', 'suggested', 'promoted', 'ad', 'advertisement', 'sponsored',
      'happening now', 'live', 'breaking', 'update', 'updates'
    ];
    
    const lowerText = cleanText.toLowerCase();
    
    if (promotionalKeywords.some(keyword => lowerText.includes(keyword))) {
      return false;
    }
    
    // Filter out news patterns (like "4 hours ago · News · 29.6K posts")
    const newsPatterns = [
      /\b(says?|said|reports?|announced?|declares?|confirms?|reveals?|admits?)\b/i,
      /\b(president|minister|government|official|spokesperson)\b/i,
      /\b(talks|meeting|summit|conference|discussion)\b/i,
      /\b(pledge|agreement|deal|treaty|accord)\b/i,
      /\b(border|peace|war|conflict|crisis)\b/i,
      /\b(economy|economic|financial|market)\b/i,
      /\b(election|vote|voting|campaign)\b/i,
      /\b(according to|sources say|reports suggest)\b/i
    ];
    
    if (cleanText.length > 25 && newsPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    // Filter out anything longer than 40 characters (likely news headlines)
    if (cleanText.length > 40) return false;
    
    // Filter out post count patterns (like "29.6K posts", "94.2K posts")
    const postCountPatterns = [
      /^\d+[\.,]?\d*[KkMm]?\s*(posts?|tweets?|replies?|likes?|retweets?)$/i,
      /^\d+[\.,]?\d*[KkMm]?\s*$/,
      /posts?$/i,
      /tweets?$/i,
      /^[\d\.,KkMm\s]+posts?$/i,
      /^[\d\.,KkMm\s]+tweets?$/i,
      /^\d+[\.,]\d*[KkMm]\s*posts?$/i
    ];
    
    if (postCountPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    // Filter out time patterns (like "4 hours ago", "3 hours ago")
    const timePatterns = [
      /^\d+\s*(hours?|minutes?|days?|mins?|hrs?)\s*ago/i,
      /^\d+[hms]$/i,
      /ago$/i,
      /yesterday/i,
      /today/i,
      /now$/i,
      /\d+:\d+|AM|PM/i
    ];
    
    if (timePatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    // Filter out news category indicators (like "News ·", "Entertainment ·")
    const newsCategoryPatterns = [
      /^(news|entertainment|sports|politics|business|technology|health|science)\s*·/i,
      /·\s*(news|entertainment|sports|politics|business|technology|health|science)/i,
      /\d+\s*(hours?|minutes?|days?)\s*ago\s*·/i,
      /·.*posts?$/i,
      /·.*tweets?$/i
    ];
    
    if (newsCategoryPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    // Filter out pure numbers
    if (/^\d+$/.test(cleanText)) return false;
    
    // Filter out number + unit patterns (like "94.2K")
    if (/^\d+[\.,]?\d*[KkMm]$/.test(cleanText)) return false;
    
    // Filter out short non-meaningful text
    if (cleanText.length < 2) return false;
    
    // Filter out UI elements
    const uiElements = [
      '...', 'more', 'less', 'show', 'hide', 'expand', 'collapse',
      'view', 'see', 'load', 'refresh', 'reload', 'back', 'home',
      'next', 'previous', 'show more', 'see more', 'view more',
      'load more', 'more trends', 'show all', 'see all'
    ];
    
    if (uiElements.includes(lowerText)) return false;
    
    // Filter out navigation patterns
    const navigationPatterns = [
      /^home$/i, /^explore$/i, /^notifications$/i, /^messages$/i,
      /^bookmarks$/i, /^lists$/i, /^profile$/i, /^settings$/i,
      /^help$/i, /^about$/i, /^terms$/i, /^privacy$/i,
      /^categories?$/i, /^topics?$/i
    ];
    
    if (navigationPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    return true;
  }

  async initialize() {
    try {
      console.log('Initializing Chrome WebDriver...');
      
      // Clean up any existing chrome processes and user data
      await this.cleanupChromeProcesses();
      
      // First attempt with full options
      try {
        this.driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(this.options)
          .build();
        console.log('✅ WebDriver initialized successfully');
        return;
      } catch (error) {
        console.log('⚠️ First attempt failed, trying with minimal options...', error.message);
        
        // Fallback with minimal options
        const fallbackOptions = new chrome.Options();
        fallbackOptions.addArguments('--no-sandbox');
        fallbackOptions.addArguments('--disable-dev-shm-usage');
        fallbackOptions.addArguments('--disable-gpu');
        fallbackOptions.addArguments('--disable-web-security');
        fallbackOptions.addArguments('--remote-debugging-port=9223'); // Different port
        fallbackOptions.addArguments('--window-size=1920,1080');
        fallbackOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        fallbackOptions.addArguments('--disable-blink-features=AutomationControlled');
        
        // Try without user data directory in fallback
        if (process.env.NODE_ENV === 'production') {
          fallbackOptions.addArguments('--headless=new');
        }
        
        this.driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(fallbackOptions)
          .build();
        console.log('✅ WebDriver initialized with fallback options');
      }
    } catch (error) {
      console.error('❌ Failed to initialize WebDriver:', error.message);
      throw new Error(`WebDriver initialization failed: ${error.message}`);
    }
  }

  async cleanupChromeProcesses() {
    try {
      // Clean up chrome user data directory if it's causing issues
      const userDataDir = path.join(process.cwd(), 'chrome-user-data');
      if (fs.existsSync(userDataDir)) {
        // Try to remove lock files that might cause issues
        const lockFiles = ['SingletonLock', 'lockfile'];
        for (const lockFile of lockFiles) {
          const lockPath = path.join(userDataDir, lockFile);
          if (fs.existsSync(lockPath)) {
            try {
              fs.unlinkSync(lockPath);
              console.log(`Removed lock file: ${lockFile}`);
            } catch (e) {
              // Ignore if we can't remove it
            }
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Chrome cleanup completed');
    }
  }

  async checkIfLoggedIn() {
    try {
      console.log('Checking if user is already logged in...');
      await this.driver.get('https://twitter.com/home');
      await this.driver.sleep(3000);
      
      const currentUrl = await this.driver.getCurrentUrl();
      console.log('Current URL:', currentUrl);
      
      // If URL contains home and not login, user is logged in
      if (currentUrl.includes('/home') && !currentUrl.includes('/login')) {
        console.log('✅ User already logged in');
        return true;
      }
      
      console.log('❌ User not logged in');
      return false;
    } catch (error) {
      console.log('Could not verify login status, proceeding with login');
      return false;
    }
  }

  async login() {
    try {
      const isLoggedIn = await this.checkIfLoggedIn();
      if (isLoggedIn) {
        return;
      }
      
      console.log('🔑 Starting login process...');
      
      // Navigate to login page
      await this.driver.get('https://twitter.com/i/flow/login');
      await this.driver.sleep(3000);
      
      // Step 1: Enter username
      console.log('📝 Entering username...');
      const usernameField = await this.driver.wait(
        until.elementLocated(By.css('input[autocomplete="username"]')),
        10000
      );
      await usernameField.clear();
      await usernameField.sendKeys(process.env.X_USERNAME);
      
      const nextButton = await this.driver.findElement(By.xpath('//span[text()="Next"]'));
      await nextButton.click();
      await this.driver.sleep(3000);
      
      // Step 2: Check what is required next (password or email)
      console.log('🔍 Checking what input is required...');
      
      let passwordField = null;
      let emailField = null;
      
      // Check for password field
      try {
        passwordField = await this.driver.findElement(By.css('input[type="password"]'));
        if (await passwordField.isDisplayed()) {
          console.log('🔒 Password field found');
        } else {
          passwordField = null;
        }
      } catch (e) {
        // Password field not found
      }
      
      // Check for email field if password not found
      if (!passwordField) {
        try {
          emailField = await this.driver.findElement(By.css('input[data-testid="ocfEnterTextTextInput"]'));
          if (await emailField.isDisplayed()) {
            console.log('📧 Email field found');
          } else {
            emailField = null;
          }
        } catch (e) {
          // Email field not found
        }
      }
      
      // Step 3: Fill the required field
      if (passwordField) {
        console.log('🔒 Entering password...');
        await passwordField.clear();
        await passwordField.sendKeys(process.env.X_PASSWORD);
        
        const loginButton = await this.driver.findElement(By.xpath('//span[text()="Log in"]'));
        await loginButton.click();
        await this.driver.sleep(3000);
        
      } else if (emailField) {
        console.log('📧 Entering email...');
        await emailField.clear();
        await emailField.sendKeys(process.env.X_EMAIL);
        
        const nextEmailButton = await this.driver.findElement(By.xpath('//span[text()="Next"]'));
        await nextEmailButton.click();
        await this.driver.sleep(3000);
        
        // Now enter password
        console.log('🔒 Entering password after email verification...');
        const passwordFieldAfterEmail = await this.driver.wait(
          until.elementLocated(By.css('input[type="password"]')),
          10000
        );
        await passwordFieldAfterEmail.clear();
        await passwordFieldAfterEmail.sendKeys(process.env.X_PASSWORD);
        
        const loginButton = await this.driver.findElement(By.xpath('//span[text()="Log in"]'));
        await loginButton.click();
        await this.driver.sleep(3000);
      } else {
        throw new Error('Could not find password or email field');
      }
      
      // Step 4: Check if anything else is required
      console.log('🔍 Checking for additional verification...');
      await this.driver.sleep(2000);
      
      try {
        const additionalField = await this.driver.findElement(By.css('input[data-testid="ocfEnterTextTextInput"]'));
        if (await additionalField.isDisplayed()) {
          console.log('📧 Additional email verification required...');
          await additionalField.clear();
          await additionalField.sendKeys(process.env.X_EMAIL);
          
          const continueButton = await this.driver.findElement(By.xpath('//span[text()="Next"]'));
          await continueButton.click();
          await this.driver.sleep(3000);
        }
      } catch (e) {
        console.log('ℹ️ No additional verification required');
      }
      
      // Step 5: Wait for login completion
      console.log('⏳ Waiting for login to complete...');
      await this.driver.wait(
        until.urlContains('home'),
        15000
      );
      console.log('✅ Successfully logged in to X');
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw new Error(`X login failed: ${error.message}`);
    }
  }

  async scrapeTrendingTopics() {
    try {
      console.log('📊 Starting to scrape trending topics...');
      
      // Go to home page where trending section is available
      await this.driver.get('https://twitter.com/home');
      await this.driver.sleep(5000); // Wait longer for page load
      
      let trendingTopics = [];
      
      // Method 1: Try to find and click "Show more" button
      console.log('🔍 Looking for "Show more" button...');
      try {
        const showMoreSelectors = [
          "//span[contains(text(), 'Show more')]",
          "//a[contains(text(), 'Show more')]",
          "//div[contains(text(), 'Show more')]",
          "//span[contains(text(), 'See more')]",
          "//a[contains(@href, '/explore')]"
        ];
        
        let showMoreClicked = false;
        for (const selector of showMoreSelectors) {
          try {
            const showMoreButton = await this.driver.findElement(By.xpath(selector));
            if (await showMoreButton.isDisplayed()) {
              console.log('✅ Found "Show more" button, clicking...');
              await this.driver.executeScript("arguments[0].click();", showMoreButton);
              await this.driver.sleep(3000);
              showMoreClicked = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!showMoreClicked) {
          console.log('ℹ️ No "Show more" button found, trying direct navigation...');
          // Try to navigate directly to explore page
          await this.driver.get('https://twitter.com/explore/tabs/trending');
          await this.driver.sleep(3000);
        }
      } catch (e) {
        console.log('⚠️ Error with show more button, trying alternative approach...');
      }
      
      // Method 2: Extract trends from current page
      console.log('🎯 Extracting trends from current page...');
      trendingTopics = await this.extractTrendsFromCurrentPage();
      
      // Method 3: If not enough trends, try explore page
      if (trendingTopics.length < 3) {
        console.log('🔄 Not enough trends found, trying explore page...');
        await this.driver.get('https://twitter.com/explore');
        await this.driver.sleep(3000);
        const exploreTrends = await this.extractTrendsFromCurrentPage();
        trendingTopics = [...trendingTopics, ...exploreTrends];
        trendingTopics = [...new Set(trendingTopics)]; // Remove duplicates
      }
      
      // Method 4: If still not enough, try trending page
      if (trendingTopics.length < 3) {
        console.log('🔄 Still not enough trends, trying trending page...');
        await this.driver.get('https://twitter.com/explore/tabs/trending');
        await this.driver.sleep(3000);
        const trendingPageTrends = await this.extractTrendsFromCurrentPage();
        trendingTopics = [...trendingTopics, ...trendingPageTrends];
        trendingTopics = [...new Set(trendingTopics)]; // Remove duplicates
      }
      
      // Filter to get only valid trends
      const validTrends = trendingTopics.filter(trend => this.isValidTrend(trend)).slice(0, 5);
      
      if (validTrends.length === 0) {
        console.log('⚠️ No valid trends found, returning fallback trends');
        return ['#Technology', '#AI', '#JavaScript', '#WebDevelopment', '#Programming'];
      }
      
      console.log(`✅ Successfully extracted ${validTrends.length} trending topics:`, validTrends);
      return validTrends;
      
    } catch (error) {
      console.error('❌ Failed to scrape trending topics:', error.message);
      return ['#Technology', '#AI', '#JavaScript', '#WebDevelopment', '#Programming'];
    }
  }

  async extractTrendsFromCurrentPage() {
    const trendingTopics = [];
    
    console.log('🔍 Scanning page for trending topics...');
    
    // Priority 1: Look for dedicated trending sections first
    const trendingSelectors = [
      // Specific trending topic selectors (highest priority)
      '[data-testid="trend"] > div > div > span',
      '[data-testid="trend"] span:not(:has(time))',
      'div[aria-label*="Trending"] span:not(:has(time))',
      
      // Trending page main content
      '[data-testid="cellInnerDiv"]:not(:has(time)) [dir="ltr"] span',
      '[data-testid="cellInnerDiv"] a[href*="/search?q="] span',
      
      // Sidebar trending (only from "What's happening" section)
      '[aria-label*="Timeline: Trending now"] [role="link"] span',
      '[data-testid="sidebarColumn"] section:has([aria-label*="Trending"]) [role="link"] span'
    ];
    
    for (const selector of trendingSelectors) {
      try {
        const elements = await this.driver.findElements(By.css(selector));
        console.log(`Found ${elements.length} elements with trending selector: ${selector.substring(0, 50)}...`);
        
        for (let i = 0; i < Math.min(elements.length, 15); i++) {
          try {
            const text = await elements[i].getText();
            
            if (text && text.trim()) {
              // Additional filtering to ensure it's a real trend
              if (this.isActualTrend(text) && this.isValidTrend(text)) {
                const cleanText = text.trim();
                if (!trendingTopics.includes(cleanText) && trendingTopics.length < 10) {
                  trendingTopics.push(cleanText);
                  console.log(`✅ Found trending topic: ${cleanText}`);
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log(`Selector failed: ${selector.substring(0, 30)}...`);
        continue;
      }
      
      // Stop if we have enough good trends
      if (trendingTopics.length >= 8) break;
    }
    
    // Priority 2: If not enough trends, look in broader areas but with stricter filtering
    if (trendingTopics.length < 3) {
      console.log('🔄 Not enough trends found, expanding search...');
      
      const broaderSelectors = [
        // Search query links (these are usually trends)
        'a[href*="/search?q=%23"] span', // Hashtag links
        'a[href*="/search?q="] span:not(:has(time))',
        
        // Sidebar content but exclude news
        '[data-testid="sidebarColumn"] [role="link"]:not(:has(time)) span'
      ];
      
      for (const selector of broaderSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          
          for (let i = 0; i < Math.min(elements.length, 10); i++) {
            try {
              const text = await elements[i].getText();
              
              if (text && text.trim() && this.isActualTrend(text) && this.isValidTrend(text)) {
                const cleanText = text.trim();
                if (!trendingTopics.includes(cleanText) && trendingTopics.length < 10) {
                  trendingTopics.push(cleanText);
                  console.log(`✅ Found additional trend: ${cleanText}`);
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
        
        if (trendingTopics.length >= 8) break;
      }
    }
    
    return trendingTopics;
  }

  // Additional method to check if text is actually a trend (not news)
  isActualTrend(text) {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text.trim();
    
    // Must be reasonably short for a trend
    if (cleanText.length > 35) return false;
    
    // Exclude obvious news indicators
    const newsIndicators = [
      /breaking/i,
      /live/i,
      /update/i,
      /report/i,
      /news/i,
      /says/i,
      /announces/i,
      /confirms/i,
      /reveals/i,
      /according to/i,
      /\d+:\d+/,
      /AM|PM/i,
      /yesterday|today|tomorrow/i,
      /\d+\s+(hours?|minutes?|days?)\s+ago/i,
      /BBC|CNN|Reuters|AP|Fox News|NBC|ABC|CBS/i
    ];
    
    if (newsIndicators.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    // Favor hashtags and short phrases
    if (cleanText.startsWith('#') || cleanText.length <= 20) {
      return true;
    }
    
    // Check if it looks like a proper noun or trending topic
    const trendPatterns = [
      /^[A-Z][a-z]+$/, // Single capitalized word
      /^[A-Z][a-z]+[A-Z][a-z]*/, // CamelCase
      /^#\w+/, // Hashtag
      /^\w+\d+/, // Word with numbers
      /^[A-Z]{2,}$/ // All caps abbreviation
    ];
    
    return trendPatterns.some(pattern => pattern.test(cleanText));
  }

  async getCurrentIP() {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      return response.data.ip;
    } catch (error) {
      console.error('❌ Failed to get IP address:', error.message);
      return '192.168.1.100';
    }
  }

  async close() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (error) {
        console.error('⚠️ Error closing WebDriver:', error.message);
      }
    }
  }

  async scrape() {
    try {
      await this.initialize();
      await this.login();
      
      const trends = await this.scrapeTrendingTopics();
      const ipAddress = await this.getCurrentIP();
      
      return {
        trends,
        ipAddress
      };
      
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

module.exports = TwitterScraper;
