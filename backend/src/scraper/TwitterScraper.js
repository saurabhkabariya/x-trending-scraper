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

    // Basic options
    this.options.addArguments('--no-sandbox');
    this.options.addArguments('--disable-dev-shm-usage');
    this.options.addArguments('--disable-blink-features=AutomationControlled');
    this.options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Performance and stability options
    this.options.addArguments('--disable-extensions');
    this.options.addArguments('--disable-plugins');
    this.options.addArguments('--disable-images');
    this.options.addArguments('--disable-background-timer-throttling');
    this.options.addArguments('--disable-backgrounding-occluded-windows');
    this.options.addArguments('--disable-renderer-backgrounding');
    this.options.addArguments('--disable-features=TranslateUI');
    this.options.addArguments('--disable-default-apps');
    this.options.addArguments('--disable-web-security');
    this.options.addArguments('--disable-features=VizDisplayCompositor');
    this.options.addArguments('--disable-ipc-flooding-protection');
    
    // Memory and GPU optimizations
    this.options.addArguments('--memory-pressure-off');
    this.options.addArguments('--max_old_space_size=4096');
    this.options.addArguments('--disable-gpu');
    this.options.addArguments('--disable-gpu-sandbox');
    
    // Network and security
    this.options.addArguments('--ignore-ssl-errors=yes');
    this.options.addArguments('--ignore-certificate-errors');
    
    // User data directory for session persistence
    try {
      this.options.addArguments('--user-data-dir=./chrome-user-data');
      this.options.addArguments('--profile-directory=Default');
    } catch (e) {
      console.log('User data directory not available, using default Chrome session');
    }
    
    if (process.env.NODE_ENV === 'production') {
      this.options.addArguments('--headless');
      this.options.addArguments('--disable-gpu');
    }
    
    if (process.env.CHROMEDRIVER_PATH) {
      const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH);
      this.service = service;
    }
  }  ensureChromeUserDataDir() {
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

  isNewsContent(text) {
    const newsIndicators = [
      /\d+:\d+|AM|PM/i,
      /yesterday|today|tomorrow|breaking/i,
      /\d+\s+(hours?|minutes?|days?)\s+ago/i,
      /BBC|CNN|Reuters|AP|Associated Press|Fox News|NBC|ABC|CBS/i,
      /News|Breaking|Report|Update|Alert/i,
      /^\w+:\s/,
      /\.\.\.$/, 
      /\d{1,2}\/\d{1,2}\/\d{2,4}/,
      /January|February|March|April|May|June|July|August|September|October|November|December/i
    ];
    
    return newsIndicators.some(pattern => pattern.test(text));
  }

  isValidTrend(text) {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text.trim();
    
    if (!cleanText || cleanText.length === 0) return false;
    
    const promotionalKeywords = [
      'subscribe',
      'premium',
      'unlock',
      'features',
      'revenue',
      'show more',
      'see more',
      'trending',
      'what\'s happening',
      'whats happening',
      'for you',
      'follow',
      'suggested',
      'promoted',
      'ad',
      'advertisement',
      'sponsored',
      'happening now',
      'live',
      'breaking',
      'update',
      'updates'
    ];
    
    const lowerText = cleanText.toLowerCase();
    
    if (promotionalKeywords.some(keyword => lowerText.includes(keyword))) {
      return false;
    }
    
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
    
    if (cleanText.length > 40) return false;
    
    const postCountPatterns = [
      /^\d+[\.,]?\d*[KkMm]?\s*(posts?|tweets?|replies?|likes?|retweets?)$/i,
      /^\d+[\.,]?\d*[KkMm]?\s*$/,
      /posts?$/i,
      /tweets?$/i,
      /^[\d\.,KkMm\s]+posts?$/i,
      /^[\d\.,KkMm\s]+tweets?$/i
    ];
    
    if (postCountPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    if (cleanText.length < 2) return false;
    
    if (/^\d+$/.test(cleanText)) return false;
    
    if (/^\d+[\.,]?\d*[KkMm]$/.test(cleanText)) return false;
    
    const uiElements = [
      '...',
      'more',
      'less',
      'show',
      'hide',
      'expand',
      'collapse',
      'view',
      'see',
      'load',
      'refresh',
      'reload',
      'back',
      'home',
      'next',
      'previous',
      'show more',
      'see more',
      'view more',
      'load more',
      'more trends',
      'show all',
      'see all'
    ];
    
    
    if (uiElements.includes(lowerText)) return false;
    
    const timePatterns = [
      /^\d+[hms]$/i,
      /ago$/i,
      /yesterday/i,
      /today/i,
      /now$/i
    ];
    
    if (timePatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    const navigationPatterns = [
      /^home$/i,
      /^explore$/i,
      /^notifications$/i,
      /^messages$/i,
      /^bookmarks$/i,
      /^lists$/i,
      /^profile$/i,
      /^settings$/i,
      /^help$/i,
      /^about$/i,
      /^terms$/i,
      /^privacy$/i,
      /^categories?$/i,
      /^topics?$/i
    ];
    
    if (navigationPatterns.some(pattern => pattern.test(cleanText))) {
      return false;
    }
    
    
    return true;
  }

  scoreTrend(text) {
    let score = 0;
    
    if (text.startsWith('#')) {
      score += 100;
    }
    
    if (text.length <= 15) {
      score += 50;
    } else if (text.length <= 25) {
      score += 30;
    } else if (text.length <= 35) {
      score += 10;
    }
    
    if (/^[A-Z][a-z]+([A-Z][a-z]*)*$/.test(text)) {
      score += 20;
    }
    
    if (/^[A-Z][a-zA-Z0-9]*$/.test(text)) {
      score += 10; 
    }
    
    const articleWords = ['the', 'and', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const lowerText = text.toLowerCase();
    let articleCount = articleWords.filter(word => lowerText.includes(` ${word} `)).length;
    score -= articleCount * 20;
    
    const headlineWords = ['says', 'said', 'reports', 'announced', 'confirms'];
    if (headlineWords.some(word => lowerText.includes(word))) {
      score -= 50;
    }
    
    return score;
  }

  async initialize() {
    try {
      console.log('Initializing Chrome WebDriver...');
      
      let builder = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(this.options);
      
      if (this.service) {
        builder.setChromeService(this.service);
      }

      try {
        this.driver = await builder.build();
        console.log('WebDriver initialized successfully');
      } catch (error) {
        console.log('First attempt failed, trying with fallback options...');
        
        const fallbackOptions = new chrome.Options();
        fallbackOptions.addArguments('--no-sandbox');
        fallbackOptions.addArguments('--disable-dev-shm-usage');
        fallbackOptions.addArguments('--disable-blink-features=AutomationControlled');
        fallbackOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        fallbackOptions.addArguments('--disable-extensions');
        fallbackOptions.addArguments('--disable-plugins');
        fallbackOptions.addArguments('--disable-images');
        fallbackOptions.addArguments('--disable-default-apps');
        fallbackOptions.addArguments('--remote-debugging-port=9222');
        
        if (process.env.NODE_ENV === 'production') {
          fallbackOptions.addArguments('--headless');
          fallbackOptions.addArguments('--disable-gpu');
        }
        
        builder = new Builder()
          .forBrowser('chrome')
          .setChromeOptions(fallbackOptions);
        
        if (this.service) {
          builder.setChromeService(this.service);
        }
        
        this.driver = await builder.build();
        console.log('WebDriver initialized with fallback options');
      }
      
    } catch (error) {
      console.error('Failed to initialize WebDriver:', error.message);
      throw new Error(`WebDriver initialization failed: ${error.message}`);
    }
  }

  async checkIfLoggedIn() {
    try {
      console.log('Checking if user is already logged in...');
      await this.driver.get('https://twitter.com/home');
      await this.driver.sleep(5000); // Wait longer for page load
      
      const currentUrl = await this.driver.getCurrentUrl();
      console.log('Current URL after navigation:', currentUrl);
      
      if (currentUrl.includes('/home') && !currentUrl.includes('/login') && !currentUrl.includes('/i/flow/login')) {
        // Try multiple methods to verify login
        try {
          await this.driver.findElement(By.css('[aria-label*="Tweet"]'));
          console.log('✅ User already logged in (found Tweet button)');
          return true;
        } catch {
          try {
            await this.driver.findElement(By.css('[data-testid="SideNav_AccountSwitcher_Button"]'));
            console.log('✅ User already logged in (found account switcher)');
            return true;
          } catch {
            try {
              await this.driver.findElement(By.css('[data-testid="SideNav_NewTweet_Button"]'));
              console.log('✅ User already logged in (found new tweet button)');
              return true;
            } catch {
              try {
                await this.driver.findElement(By.css('[data-testid="primaryColumn"]'));
                console.log('✅ User already logged in (found primary column)');
                return true;
              } catch {
                console.log('❌ Login verification failed - no indicators found');
                return false;
              }
            }
          }
        }
      }
      
      console.log('❌ User not logged in - redirected to login page');
      return false;
    } catch (error) {
      console.log('⚠️ Could not verify login status, proceeding with login. Error:', error.message);
      return false;
    }
  }

  async login() {
    try {
      const isLoggedIn = await this.checkIfLoggedIn();
      if (isLoggedIn) {
        return;
      }
      
      console.log('🔑 User not logged in, attempting login...');
      
      // Navigate to login page
      await this.driver.get('https://twitter.com/i/flow/login');
      await this.driver.sleep(3000);
      
      // Enter username
      console.log('📝 Entering username...');
      const usernameField = await this.driver.wait(
        until.elementLocated(By.css('input[autocomplete="username"]')),
        15000
      );
      await usernameField.clear();
      await usernameField.sendKeys(process.env.X_USERNAME);
      
      const nextButton = await this.driver.findElement(By.xpath('//span[text()="Next"]'));
      await nextButton.click();
      
      // Wait for next step and determine what X is asking for
      await this.driver.sleep(5000);
      
      try {
        // Check if X is asking for email verification first (suspicious login)
        console.log('🔍 Checking for email verification requirement...');
        let emailField = null;
        const emailSelectors = [
          'input[data-testid="ocfEnterTextTextInput"]',
          'input[name="text"]',
          'input[autocomplete="email"]',
          'input[type="email"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]'
        ];
        
        for (const selector of emailSelectors) {
          try {
            emailField = await this.driver.findElement(By.css(selector));
            if (emailField) {
              console.log(`✅ Found email field with selector: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (emailField) {
          console.log('📧 Email verification requested due to suspicious login, providing email...');
          
          if (!process.env.X_EMAIL) {
            throw new Error('X_EMAIL environment variable is required for email verification');
          }
          
          await emailField.clear();
          await emailField.sendKeys(process.env.X_EMAIL);
          
          // Click Next after email
          const nextEmailButton = await this.driver.findElement(By.xpath('//span[text()="Next"]'));
          await nextEmailButton.click();
          await this.driver.sleep(5000);
          
          // Now look for password field after email verification
          console.log('🔒 Looking for password field after email verification...');
          const passwordFieldAfterEmail = await this.driver.wait(
            until.elementLocated(By.css('input[type="password"]')),
            15000
          );
          await passwordFieldAfterEmail.clear();
          await passwordFieldAfterEmail.sendKeys(process.env.X_PASSWORD);
          
          // Click Log in button
          const loginButtonAfterEmail = await this.driver.findElement(By.xpath('//span[text()="Log in"]'));
          await loginButtonAfterEmail.click();
        }
      } catch (emailError) {
        // Email verification not requested, look for password field directly
        console.log('ℹ️ No email verification required, proceeding with password...');
        
        try {
          console.log('🔒 Looking for password field...');
          const passwordField = await this.driver.wait(
            until.elementLocated(By.css('input[type="password"]')),
            15000
          );
          await passwordField.clear();
          await passwordField.sendKeys(process.env.X_PASSWORD);
          
          // Click Log in button
          const loginButton = await this.driver.findElement(By.xpath('//span[text()="Log in"]'));
          await loginButton.click();
        } catch (passwordError) {
          console.error('❌ Could not find password field:', passwordError.message);
          
          // Try to capture what's on the page for debugging
          const currentUrl = await this.driver.getCurrentUrl();
          const pageTitle = await this.driver.getTitle();
          console.log(`🔍 Debug info - URL: ${currentUrl}, Title: ${pageTitle}`);
          
          throw new Error('Login flow failed: Could not proceed after username');
        }
      }
      
      // Wait for home page to load with extended timeout
      console.log('⏳ Waiting for login to complete...');
      try {
        await this.driver.wait(
          until.urlContains('home'),
          30000  // Increased timeout to 30 seconds
        );
        console.log('✅ Successfully logged in to X');
      } catch (timeoutError) {
        // Check if we're actually logged in by looking for other indicators
        const currentUrl = await this.driver.getCurrentUrl();
        console.log('⚠️ Login timeout, checking current URL:', currentUrl);
        
        // Check for alternative login success indicators
        if (currentUrl.includes('home') || currentUrl.includes('explore') || (currentUrl.includes('twitter.com') && !currentUrl.includes('login'))) {
          console.log('✅ Login appears successful despite timeout');
        } else {
          // Try to detect specific error conditions
          try {
            const errorElements = await this.driver.findElements(By.css('[data-testid="error"], .error, [role="alert"]'));
            if (errorElements.length > 0) {
              const errorText = await errorElements[0].getText();
              throw new Error(`Login failed with error: ${errorText}`);
            }
          } catch {
            // No error elements found
          }
          
          // Check if we're stuck on a verification page
          const pageTitle = await this.driver.getTitle();
          if (pageTitle.includes('verification') || pageTitle.includes('Verification')) {
            throw new Error('Login failed: Account requires additional verification. Please login manually first.');
          }
          
          throw new Error(`Login failed: Still on login page after timeout. Current URL: ${currentUrl}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw new Error(`X login failed: ${error.message}`);
    }
  }

  async scrapeTrendingTopics() {
    try {
      
      await this.driver.get('https://twitter.com/explore');
      await this.driver.sleep(5000);
      
      let trendingTopics = await this.extractTrendsFromPage();
      
      if (trendingTopics.length < 3) {
        
        await this.driver.get('https://twitter.com/home');
        await this.driver.sleep(5000);
        
        const homeTrends = await this.extractTrendsFromPage();
        trendingTopics = [...trendingTopics, ...homeTrends];
      }
      
      trendingTopics = [...new Set(trendingTopics)];
      
      if (trendingTopics.length < 3) {
        
        await this.driver.get('https://twitter.com/explore/tabs/trending');
        await this.driver.sleep(5000);
        
        const trendingPageTrends = await this.extractTrendsFromPage();
        trendingTopics = [...trendingTopics, ...trendingPageTrends];
        trendingTopics = [...new Set(trendingTopics)];
      }
      
      if (trendingTopics.length < 5) {
        
        const linkTrends = await this.extractTrendsFromLinks();
        trendingTopics = [...trendingTopics, ...linkTrends];
        trendingTopics = [...new Set(trendingTopics)];
      }
      
      if (trendingTopics.length < 5) {
        
        const mockTrends = [
          '#TechNews',
          '#AI',
          '#JavaScript',
          '#WebDevelopment',
          '#OpenSource',
          '#Programming',
          '#Technology',
          '#Innovation'
        ];
        for (const mockTrend of mockTrends) {
          if (!trendingTopics.includes(mockTrend) && trendingTopics.length < 5) {
            trendingTopics.push(mockTrend);
          }
        }
      }
      
      const finalTrends = trendingTopics.slice(0, 5);
      
      
      return finalTrends;
      
    } catch (error) {
      console.error('❌ Failed to scrape trending topics:', error.message);
      
      const fallbackTrends = ['#Technology', '#AI', '#JavaScript', '#WebDevelopment', '#Programming'];
      
      return fallbackTrends;
    }
  }

  async extractTrendsFromPage() {
    try {
      
      
      const trendingPageUrl = await this.navigateToTrendingPage();
      
      if (!trendingPageUrl) {
        
        return await this.extractFromCurrentPage();
      }
      
      await this.driver.sleep(3000);
      
      
      const trendingTopics = await this.extractTrendsFromTrendingPage();
      
      
      return trendingTopics;
      
    } catch (error) {
      console.error('❌ Error extracting trends:', error);
      return await this.extractFromCurrentPage();
    }
  }

  async navigateToTrendingPage() {
    try {
      const showMoreSelectors = [
        'a[href*="/explore"]',
        'a[href*="/i/trends"]', 
        '[aria-label*="Show more"]',
        '[role="link"]:has-text("Show more")',
        'div[data-testid="sidebarColumn"] a[href*="explore"]',
        'section a[href*="explore"]'
      ];
      
      for (const selector of showMoreSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          
          for (const element of elements) {
            try {
              const text = await element.getText();
              const href = await element.getAttribute('href');
              
              console.log(`Found potential "Show more" link: "${text}" -> ${href}`);
              
              if (text.toLowerCase().includes('show more') || 
                  text.toLowerCase().includes('see more') ||
                  href.includes('/explore') || 
                  href.includes('/trends')) {
                
                
                await this.driver.executeScript("arguments[0].click();", element);
                await this.driver.sleep(2000);
                
                const currentUrl = await this.driver.getCurrentUrl();
                console.log(`Navigated to: ${currentUrl}`);
                return currentUrl;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      
      await this.driver.get('https://twitter.com/explore/tabs/trending');
      await this.driver.sleep(3000);
      return await this.driver.getCurrentUrl();
      
    } catch (error) {
      
      return null;
    }
  }

  async extractTrendsFromTrendingPage() {
    try {
      
      const trendingTopics = [];
      
      await this.driver.sleep(2000);
      
      const trendSelectors = [
        'div[data-testid="cellInnerDiv"]:not(:has(time)) [dir="ltr"] span',
        '[data-testid="trend"] span',
        'div[aria-label*="Trending"] span:not(:has(time))',
        
        'a[href*="/search?q="] span',
        'div[data-testid="cellInnerDiv"] a span',
        
        'section div[dir="ltr"] > span'
      ];
      
      for (const selector of trendSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          
          if (elements.length > 0) {
            console.log(`Found ${elements.length} potential trends with: ${selector}`);
            
            for (let i = 0; i < Math.min(elements.length, 30); i++) {
              try {
                const text = await elements[i].getText();
                
                if (this.isValidTrend(text) && !this.isNewsContent(text)) {
                  const cleanText = text.trim();
                  
                  if (!trendingTopics.includes(cleanText)) {
                    const score = this.scoreTrend(cleanText);
                    
                    if (score > 0) {
                      trendingTopics.push(cleanText);
                      console.log(`Added trend: ${cleanText} (position: ${trendingTopics.length})`);
                      
                      if (trendingTopics.length >= 5) break;
                    }
                  }
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (e) {
          continue;
        }
        
        if (trendingTopics.length >= 5) break;
      }
      
      return trendingTopics.slice(0, 5);
      
    } catch (error) {
      
      return [];
    }
  }

  async extractFromCurrentPage() {
    try {
      
      
      const trendingTopics = [];
      const selectors = [
        '[data-testid="sidebarColumn"] [role="link"] span',
        '[data-testid="sidebarColumn"] div[dir="ltr"] span',
        '[aria-label*="Trending"] span',
        'div[data-testid="cellInnerDiv"] span'
      ];
      
      for (const selector of selectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          for (let i = 0; i < Math.min(elements.length, 20); i++) {
            try {
              const text = await elements[i].getText();
              
              if (this.isValidTrend(text)) {
                const cleanText = text.trim();
                
                if (!trendingTopics.includes(cleanText)) {
                  trendingTopics.push(cleanText);
                  if (trendingTopics.length >= 10) break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
        
        if (trendingTopics.length >= 10) break;
      }
      
      return trendingTopics.slice(0, 5);
      
    } catch (error) {
      
      return [];
    }
  }

  async extractTrendsFromLinks() {
    const trendingTopics = [];
    
    try {
      
      const linkSelectors = [
        'a[href*="/explore/tabs/trending"]',
        'a[href*="/search?q="]',
        '[role="link"][aria-label*="trend"]',
        '[role="link"] span',
        'div[data-testid="sidebarColumn"] [role="link"]'
      ];
      
      for (const selector of linkSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          
          if (elements.length > 0) {
            console.log(`📍 Found ${elements.length} potential trend links with selector: ${selector}`);
            
            for (let i = 0; i < Math.min(elements.length, 15); i++) {
              try {
                const text = await elements[i].getText();
                
                if (this.isValidTrend(text)) {
                  const cleanText = text.trim();
                  
                  if (!trendingTopics.includes(cleanText)) {
                    const score = this.scoreTrend(cleanText);
                    
                    if (score > 0) {
                      trendingTopics.push(cleanText);
                      console.log(`✅ Added trend from link: ${cleanText} (score: ${score})`);
                      
                      if (trendingTopics.length >= 10) break;
                    }
                  }
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return trendingTopics.slice(0, 5);
      
    } catch (error) {
      
      return [];
    }
  }

  async expandTrendingSection() {
    try {
      
      const showMoreSelectors = [
        'span:contains("Show more")',
        'span:contains("See more")',
        'span:contains("More trends")',
        'a:contains("Show more")',
        'a:contains("See more")',
        '[role="button"]:contains("Show more")',
        '[role="button"]:contains("See more")',
        'div:contains("Show more")',
        'div:contains("See more")'
      ];
      
      const xpathSelectors = [
        "//span[contains(text(), 'Show more')]",
        "//span[contains(text(), 'See more')]",
        "//span[contains(text(), 'More trends')]",
        "//a[contains(text(), 'Show more')]",
        "//a[contains(text(), 'See more')]",
        "//div[@role='button' and contains(text(), 'Show more')]",
        "//div[@role='button' and contains(text(), 'See more')]",
        "//div[contains(text(), 'Show more')]",
        "//div[contains(text(), 'See more')]"
      ];
      
      for (const xpath of xpathSelectors) {
        try {
          const elements = await this.driver.findElements(By.xpath(xpath));
          
          if (elements.length > 0) {
            console.log(`📍 Found ${elements.length} "Show more" elements with xpath: ${xpath}`);
            
            for (let element of elements) {
              try {
                const isDisplayed = await element.isDisplayed();
                if (isDisplayed) {
                  
                  await element.click();
                  
                  await this.driver.sleep(2000);
                  
                  
                  return;
                }
              } catch (clickError) {
                
                continue;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      
      
    } catch (error) {
      
    }
  }

  async getCurrentIP() {
    try {
      
      
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.myip.com'
      ];
      
      for (const service of ipServices) {
        try {
          const response = await axios.get(service, { timeout: 5000 });
          
          let ip;
          if (response.data.ip) {
            ip = response.data.ip;
          } else if (response.data.query) {
            ip = response.data.query;
          } else if (typeof response.data === 'string') {
            ip = response.data.trim();
          }
          
          if (ip) {
            
            return ip;
          }
        } catch (e) {
          continue;
        }
      }
      
      const fallbackIP = '192.168.1.100';
      
      return fallbackIP;
      
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
