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
      await this.driver.sleep(5000); // Longer wait for production
      
      // Step 1: Enter username with multiple selectors and longer timeout
      console.log('📝 Entering username...');
      
      const usernameSelectors = [
        'input[autocomplete="username"]',
        'input[name="text"]',
        'input[data-testid="ocfEnterTextTextInput"]',
        'input[type="text"]',
        'input[placeholder*="username"]',
        'input[placeholder*="Username"]',
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]'
      ];
      
      let usernameField = null;
      const maxTimeout = process.env.NODE_ENV === 'production' ? 30000 : 15000; // 30s for production
      
      console.log(`⏳ Waiting up to ${maxTimeout/1000}s for username field...`);
      
      // Try each selector until we find one that works
      for (const selector of usernameSelectors) {
        try {
          console.log(`🔍 Trying selector: ${selector}`);
          usernameField = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            5000 // 5s per selector
          );
          
          if (await usernameField.isDisplayed()) {
            console.log(`✅ Found username field with selector: ${selector}`);
            break;
          } else {
            usernameField = null;
          }
        } catch (e) {
          console.log(`❌ Selector failed: ${selector}`);
          continue;
        }
      }
      
      if (!usernameField) {
        // Final attempt with longer wait on the primary selector
        console.log('🔄 Making final attempt with primary selector...');
        try {
          usernameField = await this.driver.wait(
            until.elementLocated(By.css('input[autocomplete="username"]')),
            maxTimeout
          );
        } catch (finalError) {
          throw new Error(`Could not find username field after trying all selectors. Page may not have loaded properly.`);
        }
      }
      
      await usernameField.clear();
      await usernameField.sendKeys(process.env.X_USERNAME);
      
      // Find and click Next button with multiple selectors
      const nextButtonSelectors = [
        '//span[text()="Next"]',
        '//button[contains(text(), "Next")]',
        '//div[contains(text(), "Next")]',
        '//span[contains(text(), "Next")]',
        '[data-testid="LoginForm_Login_Button"]'
      ];
      
      let nextButton = null;
      for (const selector of nextButtonSelectors) {
        try {
          nextButton = await this.driver.findElement(By.xpath(selector));
          if (await nextButton.isDisplayed()) {
            console.log(`✅ Found Next button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!nextButton) {
        throw new Error('Could not find Next button');
      }
      
      await nextButton.click();
      await this.driver.sleep(5000); // Longer wait for production
      
      // Step 2: Check what is required next (password or email)
      console.log('🔍 Checking what input is required...');
      
      let passwordField = null;
      let emailField = null;
      
      // Check for password field with multiple selectors
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[data-testid="ocfEnterTextTextInput"][type="password"]'
      ];
      
      for (const selector of passwordSelectors) {
        try {
          passwordField = await this.driver.findElement(By.css(selector));
          if (await passwordField.isDisplayed()) {
            console.log(`🔒 Found password field with selector: ${selector}`);
            break;
          } else {
            passwordField = null;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Check for email field if password not found
      if (!passwordField) {
        const emailSelectors = [
          'input[data-testid="ocfEnterTextTextInput"]',
          'input[name="text"]',
          'input[type="email"]',
          'input[autocomplete="email"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]'
        ];
        
        for (const selector of emailSelectors) {
          try {
            emailField = await this.driver.findElement(By.css(selector));
            if (await emailField.isDisplayed()) {
              console.log(`📧 Found email field with selector: ${selector}`);
              break;
            } else {
              emailField = null;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      // Step 3: Fill the required field
      if (passwordField) {
        console.log('🔒 Entering password...');
        await passwordField.clear();
        await passwordField.sendKeys(process.env.X_PASSWORD);
        
        const loginButtonSelectors = [
          '//span[text()="Log in"]',
          '//button[contains(text(), "Log in")]',
          '//div[contains(text(), "Log in")]',
          '[data-testid="LoginForm_Login_Button"]'
        ];
        
        let loginButton = null;
        for (const selector of loginButtonSelectors) {
          try {
            loginButton = await this.driver.findElement(By.xpath(selector));
            if (await loginButton.isDisplayed()) {
              console.log(`✅ Found login button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!loginButton) {
          throw new Error('Could not find login button');
        }
        
        await loginButton.click();
        await this.driver.sleep(5000);
        
      } else if (emailField) {
        console.log('📧 Entering email...');
        await emailField.clear();
        await emailField.sendKeys(process.env.X_EMAIL);
        
        const nextEmailButtonSelectors = [
          '//span[text()="Next"]',
          '//button[contains(text(), "Next")]',
          '[data-testid="ocfEnterTextNextButton"]'
        ];
        
        let nextEmailButton = null;
        for (const selector of nextEmailButtonSelectors) {
          try {
            nextEmailButton = await this.driver.findElement(By.xpath(selector));
            if (await nextEmailButton.isDisplayed()) {
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!nextEmailButton) {
          throw new Error('Could not find Next button after email');
        }
        
        await nextEmailButton.click();
        await this.driver.sleep(5000);
        
        // Now enter password
        console.log('🔒 Entering password after email verification...');
        let passwordFieldAfterEmail = null;
        
        for (const selector of passwordSelectors) {
          try {
            passwordFieldAfterEmail = await this.driver.wait(
              until.elementLocated(By.css(selector)),
              15000
            );
            if (await passwordFieldAfterEmail.isDisplayed()) {
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!passwordFieldAfterEmail) {
          throw new Error('Could not find password field after email verification');
        }
        
        await passwordFieldAfterEmail.clear();
        await passwordFieldAfterEmail.sendKeys(process.env.X_PASSWORD);
        
        let loginButton = null;
        const loginButtonSelectors = [
          '//span[text()="Log in"]',
          '//button[contains(text(), "Log in")]',
          '[data-testid="LoginForm_Login_Button"]'
        ];
        
        for (const selector of loginButtonSelectors) {
          try {
            loginButton = await this.driver.findElement(By.xpath(selector));
            if (await loginButton.isDisplayed()) {
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!loginButton) {
          throw new Error('Could not find login button after password');
        }
        
        await loginButton.click();
        await this.driver.sleep(5000);
      } else {
        throw new Error('Could not find password or email field');
      }
      
      // Step 4: Check for additional verification
      console.log('🔍 Checking for additional verification...');
      await this.driver.sleep(3000);
      
      try {
        const additionalSelectors = [
          'input[data-testid="ocfEnterTextTextInput"]',
          'input[name="text"]',
          'input[type="email"]',
          'input[autocomplete="email"]'
        ];
        
        let additionalField = null;
        for (const selector of additionalSelectors) {
          try {
            additionalField = await this.driver.findElement(By.css(selector));
            if (await additionalField.isDisplayed()) {
              console.log(`✅ Found additional field with selector: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (additionalField) {
          console.log('📧 Additional email verification required...');
          await additionalField.clear();
          await additionalField.sendKeys(process.env.X_EMAIL);
          console.log('✅ Email entered successfully');
          
          // Wait a moment for the page to process the input
          await this.driver.sleep(2000);
          
          const continueButtonSelectors = [
            '//span[text()="Next"]',
            '//span[text()="Continue"]',
            '//span[text()="Verify"]',
            '//button[contains(text(), "Next")]',
            '//button[contains(text(), "Continue")]',
            '//button[contains(text(), "Verify")]',
            '[data-testid="ocfEnterTextNextButton"]',
            '//div[@data-testid="ocfEnterTextNextButton"]',
            '//span[contains(text(), "Submit")]'
          ];
          
          let continueButton = null;
          let usedSelector = '';
          
          for (const selector of continueButtonSelectors) {
            try {
              continueButton = await this.driver.findElement(By.xpath(selector));
              if (await continueButton.isDisplayed() && await continueButton.isEnabled()) {
                usedSelector = selector;
                console.log(`✅ Found continue button with selector: ${selector}`);
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (continueButton) {
            console.log('🔄 Clicking continue button...');
            await continueButton.click();
            console.log('✅ Continue button clicked successfully');
            await this.driver.sleep(5000); // Wait longer for processing
            
            // Check if we need to handle any additional steps
            const currentUrl = await this.driver.getCurrentUrl();
            console.log(`🔍 URL after continue button: ${currentUrl}`);
            
            // If still on login flow, try to detect and skip any remaining verification
            if (currentUrl.includes('/flow/login') || currentUrl.includes('/login')) {
              console.log('🔄 Still on login flow, checking for additional steps...');
              
              // Check for any skip options or try direct navigation
              try {
                const skipSelectors = [
                  '//span[text()="Skip"]',
                  '//span[text()="Skip for now"]',
                  '//span[text()="Not now"]',
                  '//button[contains(text(), "Skip")]',
                  '//a[contains(text(), "Skip")]'
                ];
                
                let skipButton = null;
                for (const selector of skipSelectors) {
                  try {
                    skipButton = await this.driver.findElement(By.xpath(selector));
                    if (await skipButton.isDisplayed()) {
                      console.log(`✅ Found skip button: ${selector}`);
                      await skipButton.click();
                      console.log('✅ Skip button clicked');
                      await this.driver.sleep(3000);
                      break;
                    }
                  } catch (e) {
                    continue;
                  }
                }
                
                // If no skip button, try direct navigation to home
                if (!skipButton) {
                  console.log('🏠 No skip button found, trying direct navigation to home...');
                  await this.driver.get('https://twitter.com/home');
                  await this.driver.sleep(5000);
                }
              } catch (skipError) {
                console.log('⚠️ Error during skip attempt:', skipError.message);
              }
            }
          } else {
            console.log('⚠️ Could not find continue button after email verification');
            console.log('🔍 Available buttons on page:');
            
            // Debug: List all visible buttons on the page
            try {
              const allButtons = await this.driver.findElements(By.css('button, [role="button"], span'));
              for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
                try {
                  const buttonText = await allButtons[i].getText();
                  if (buttonText && buttonText.trim()) {
                    console.log(`  - Button: "${buttonText.trim()}"`);
                  }
                } catch (e) {
                  // Ignore errors when getting button text
                }
              }
            } catch (debugError) {
              console.log('Could not list buttons for debugging');
            }
            
            // Try to proceed anyway
            console.log('🔄 Attempting to proceed without clicking continue button...');
          }
        } else {
          console.log('ℹ️ No additional verification field found');
        }
      } catch (e) {
        console.log('⚠️ Error during additional verification:', e.message);
      }
      
      // Step 5: Wait for login completion with extended timeout for production
      console.log('⏳ Waiting for login to complete...');
      const loginTimeout = process.env.NODE_ENV === 'production' ? 30000 : 15000;
      
      try {
        await this.driver.wait(
          until.urlContains('home'),
          loginTimeout
        );
        console.log('✅ Successfully logged in to X');
      } catch (timeoutError) {
        console.log('⏰ Login timeout occurred, performing extended verification...');
        
        // Extended verification with multiple checks and fallback navigation
        let verificationAttempts = 0;
        const maxVerificationAttempts = 3;
        
        while (verificationAttempts < maxVerificationAttempts) {
          verificationAttempts++;
          console.log(`🔍 Login verification attempt ${verificationAttempts}/${maxVerificationAttempts}`);
          
          const currentUrl = await this.driver.getCurrentUrl();
          console.log(`📍 Current URL: ${currentUrl}`);
          
          // Check various success indicators
          const isLoggedIn = currentUrl.includes('home') || 
                           (currentUrl.includes('x.com') && !currentUrl.includes('login') && !currentUrl.includes('flow')) ||
                           currentUrl.includes('i/bookmarks') ||
                           currentUrl.includes('notifications') ||
                           currentUrl.includes('explore');
          
          if (isLoggedIn) {
            console.log('✅ Login verification successful based on URL');
            break;
          }
          
          // Try navigating to home if still on login/flow page
          if (currentUrl.includes('login') || currentUrl.includes('flow')) {
            console.log('🔄 Still on login/flow page, attempting direct navigation...');
            
            try {
              await this.driver.get('https://twitter.com/home');
              await this.driver.sleep(5000);
              
              const newUrl = await this.driver.getCurrentUrl();
              console.log(`📍 After navigation, URL: ${newUrl}`);
              
              if (newUrl.includes('home') || (newUrl.includes('x.com') && !newUrl.includes('login'))) {
                console.log('✅ Direct navigation successful - login verified');
                break;
              }
            } catch (navError) {
              console.log('⚠️ Navigation attempt failed:', navError.message);
            }
          }
          
          // Check for any remaining verification screens
          try {
            const bodyText = await this.driver.findElement(By.css('body')).getText();
            
            if (bodyText.includes('Welcome to X') || 
                bodyText.includes('Home') || 
                bodyText.includes('Timeline') ||
                bodyText.includes('What\'s happening')) {
              console.log('✅ Login successful based on page content');
              break;
            }
            
            // Look for any remaining continue/finish buttons
            const finalButtons = [
              'Continue to X', 'Continue', 'Finish', 'Done', 'Get started',
              'Skip for now', 'Not now', 'Maybe later'
            ];
            
            for (const buttonText of finalButtons) {
              try {
                const button = await this.driver.findElement(
                  By.xpath(`//span[contains(text(), "${buttonText}")]//ancestor::button | //button[contains(text(), "${buttonText}")]`)
                );
                
                if (await button.isDisplayed()) {
                  console.log(`🔘 Found final button: "${buttonText}", clicking...`);
                  await button.click();
                  await this.driver.sleep(3000);
                  break;
                }
              } catch (e) {
                // Continue searching
              }
            }
            
          } catch (contentError) {
            console.log('⚠️ Could not check page content:', contentError.message);
          }
          
          if (verificationAttempts < maxVerificationAttempts) {
            console.log('⏳ Waiting before next verification attempt...');
            await this.driver.sleep(5000);
          }
        }
        
        // Final verification
        const finalUrl = await this.driver.getCurrentUrl();
        console.log(`📍 Final verification URL: ${finalUrl}`);
        
        if (finalUrl.includes('home') || 
            (finalUrl.includes('x.com') && !finalUrl.includes('login') && !finalUrl.includes('flow'))) {
          console.log('✅ Login verification completed successfully');
        } else {
          throw new Error(`Login verification failed - final URL: ${finalUrl}`);
        }
      }
      
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
      let navigatedToTrends = false;
      
      // Method 1: Try to find and click "Show more" button in What's happening section
      console.log('🔍 Looking for "Show more" button in What\'s happening section...');
      try {
        // More specific selectors for the "Show more" button in trending section
        const showMoreSelectors = [
          // Target the specific "Show more" in trending/what's happening section
          "//div[contains(@aria-label, 'Timeline: Trending now')]//span[contains(text(), 'Show more')]",
          "//section[contains(@aria-labelledby, 'accessible-list')]//span[contains(text(), 'Show more')]",
          "//div[@data-testid='sidebarColumn']//span[contains(text(), 'Show more')]",
          "//div[@data-testid='sidebarColumn']//a[contains(text(), 'Show more')]",
          
          // Generic fallbacks
          "//span[contains(text(), 'Show more')]",
          "//a[contains(text(), 'Show more')]",
          "//span[contains(text(), 'See more')]",
          
          // Direct links to explore/trending
          "//a[contains(@href, '/explore')]",
          "//a[contains(@href, '/trending')]"
        ];
        
        for (const selector of showMoreSelectors) {
          try {
            const showMoreElements = await this.driver.findElements(By.xpath(selector));
            
            for (const element of showMoreElements) {
              try {
                if (await element.isDisplayed()) {
                  console.log(`✅ Found "Show more" button with selector: ${selector.substring(0, 50)}...`);
                  
                  // Click the button
                  await this.driver.executeScript("arguments[0].click();", element);
                  await this.driver.sleep(4000); // Wait for navigation
                  
                  // Check if we were redirected to a trending page
                  const currentUrl = await this.driver.getCurrentUrl();
                  console.log(`🔍 Current URL after click: ${currentUrl}`);
                  
                  if (currentUrl.includes('/explore') || currentUrl.includes('/trending')) {
                    console.log('✅ Successfully navigated to trending page');
                    navigatedToTrends = true;
                    break;
                  } else {
                    console.log('ℹ️ Click did not navigate to trending page, trying next selector...');
                    // Go back to home page for next attempt
                    await this.driver.get('https://twitter.com/home');
                    await this.driver.sleep(3000);
                  }
                }
              } catch (clickError) {
                console.log(`❌ Failed to click element: ${clickError.message}`);
                continue;
              }
            }
            
            if (navigatedToTrends) break;
          } catch (e) {
            continue;
          }
        }
        
        // If no show more button worked, try direct navigation
        if (!navigatedToTrends) {
          console.log('ℹ️ No working "Show more" button found, trying direct navigation...');
          await this.driver.get('https://twitter.com/explore/tabs/trending');
          await this.driver.sleep(4000);
          
          const currentUrl = await this.driver.getCurrentUrl();
          if (currentUrl.includes('/explore') || currentUrl.includes('/trending')) {
            console.log('✅ Successfully navigated to trending page via direct URL');
            navigatedToTrends = true;
          }
        }
      } catch (e) {
        console.log('⚠️ Error with show more button navigation:', e.message);
      }
      
      // Method 2: Extract trends from current page (should be trending page now)
      console.log('🎯 Extracting trends from current page...');
      if (navigatedToTrends) {
        // We're on a dedicated trending page, use trending-specific extraction
        trendingTopics = await this.extractTrendsFromTrendingPage();
      } else {
        // We're still on home page, extract from sidebar
        trendingTopics = await this.extractTrendsFromHomePage();
      }
      
      // Method 3: If not enough trends, try explore page
      if (trendingTopics.length < 3) {
        console.log('🔄 Not enough trends found, trying explore page...');
        await this.driver.get('https://twitter.com/explore');
        await this.driver.sleep(4000);
        const exploreTrends = await this.extractTrendsFromTrendingPage();
        trendingTopics = [...trendingTopics, ...exploreTrends];
        trendingTopics = [...new Set(trendingTopics)]; // Remove duplicates
      }
      
      // Method 4: If still not enough, try dedicated trending page
      if (trendingTopics.length < 3) {
        console.log('🔄 Still not enough trends, trying dedicated trending page...');
        await this.driver.get('https://twitter.com/explore/tabs/trending');
        await this.driver.sleep(4000);
        const trendingPageTrends = await this.extractTrendsFromTrendingPage();
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

  // Specialized method for extracting trends from dedicated trending pages
  async extractTrendsFromTrendingPage() {
    const trendingTopics = [];
    
    console.log('🔍 Scanning trending page for trending topics...');
    
    // Trending page specific selectors (highest priority)
    const trendingPageSelectors = [
      // Main trending content on explore/trending pages
      '[data-testid="trend"] > div > div > span',
      '[data-testid="trend"] span:not(:has(time))',
      '[data-testid="cellInnerDiv"] > div > div > span:first-child',
      '[data-testid="cellInnerDiv"] a[href*="/search?q="] span',
      
      // Trending list items
      'div[aria-label*="Trending"] span:not(:has(time))',
      'section[aria-labelledby*="accessible-list"] [role="link"] span',
      
      // Search query links (usually trends)
      'a[href*="/search?q=%23"] span', // Hashtag links
      'a[href*="/search?q="] span:first-child',
      
      // Main content area trending
      '[data-testid="cellInnerDiv"]:not(:has(time)) [dir="ltr"] span:first-child'
    ];
    
    for (const selector of trendingPageSelectors) {
      try {
        const elements = await this.driver.findElements(By.css(selector));
        console.log(`Found ${elements.length} elements with trending page selector: ${selector.substring(0, 50)}...`);
        
        for (let i = 0; i < Math.min(elements.length, 20); i++) {
          try {
            const text = await elements[i].getText();
            
            if (text && text.trim()) {
              if (this.isActualTrend(text) && this.isValidTrend(text)) {
                const cleanText = text.trim();
                if (!trendingTopics.includes(cleanText) && trendingTopics.length < 15) {
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
        console.log(`Trending page selector failed: ${selector.substring(0, 30)}...`);
        continue;
      }
      
      // Stop if we have enough good trends
      if (trendingTopics.length >= 10) break;
    }
    
    return trendingTopics;
  }

  // Specialized method for extracting trends from home page sidebar
  async extractTrendsFromHomePage() {
    const trendingTopics = [];
    
    console.log('🔍 Scanning home page sidebar for trending topics...');
    
    // Home page sidebar specific selectors
    const sidebarSelectors = [
      // Sidebar trending section (What's happening)
      '[data-testid="sidebarColumn"] [aria-label*="Timeline: Trending now"] [role="link"] span',
      '[data-testid="sidebarColumn"] section [role="link"] span:first-child',
      '[data-testid="sidebarColumn"] [role="link"] span[dir="ltr"]',
      
      // What's happening section
      '[aria-label*="Timeline: Trending now"] span:not(:has(time))',
      '[data-testid="sidebarColumn"] div[dir="ltr"] span:first-child',
      
      // Trending in sidebar
      '[data-testid="sidebarColumn"] a[href*="/search?q="] span'
    ];
    
    for (const selector of sidebarSelectors) {
      try {
        const elements = await this.driver.findElements(By.css(selector));
        console.log(`Found ${elements.length} elements with sidebar selector: ${selector.substring(0, 50)}...`);
        
        for (let i = 0; i < Math.min(elements.length, 15); i++) {
          try {
            const text = await elements[i].getText();
            
            if (text && text.trim()) {
              if (this.isActualTrend(text) && this.isValidTrend(text)) {
                const cleanText = text.trim();
                if (!trendingTopics.includes(cleanText) && trendingTopics.length < 10) {
                  trendingTopics.push(cleanText);
                  console.log(`✅ Found sidebar trend: ${cleanText}`);
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log(`Sidebar selector failed: ${selector.substring(0, 30)}...`);
        continue;
      }
      
      // Stop if we have enough trends
      if (trendingTopics.length >= 8) break;
    }
    
    return trendingTopics;
  }

  // Legacy method kept for compatibility
  async extractTrendsFromCurrentPage() {
    // Check current URL to determine which extraction method to use
    const currentUrl = await this.driver.getCurrentUrl();
    
    if (currentUrl.includes('/explore') || currentUrl.includes('/trending')) {
      return await this.extractTrendsFromTrendingPage();
    } else {
      return await this.extractTrendsFromHomePage();
    }
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
