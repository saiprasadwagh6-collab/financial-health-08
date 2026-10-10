import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ALLOWED_CATEGORIES = [
  'Income',
  'Investment',
  'Food',
  'Housing',
  'Utilities',
  'Transport',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Personal Care',
  'Other',
];

// Fallback rule-based classifier with domain knowledge of banking narrations & UPI handles
export function ruleBasedCategorize(textToMatch: string, isIncome: boolean): string {
  if (isIncome) return 'Income';
  const text = (textToMatch || '').toLowerCase();

  // Investment & Wealth accumulation (Zerodha, Mutual funds, SIP, PPF, Gold, Stocks)
  if (
    /zerodha|groww|upstox|angel\s*one|kuvera|indmoney|coin|kite|mf|mutual\s*fund|sip|uti|sbi\s*mf|hdfc\s*mf|icici\s*pru|nippon|axis\s*mf|mirae|ppfas|parag\s*parikh|shares|equity|stock|demat|cdsl|nsdl|bse|nse|crypto|binance|wazirx|coindcx|gold|sovereign|sbg|fd|fixed\s*deposit|rd|recurring|nps|ppf|lic|pension|bonds|treasury|dividend|smallcase/i.test(
      text
    )
  ) {
    return 'Investment';
  }

  // Food & Dining & Groceries
  if (
    /swiggy|zomato|starbucks|mcdonald|kfc|pizza|domino|burger|subway|blinkit|zepto|instamart|bbnow|bigbasket|dmart|grocery|supermarket|kirana|restaurant|cafe|chai|tea|coffee|bakery|bake|baker|sweets|mithai|dining|eat|barbeque|bistro|dhaba|mess|kitchen|haldiram|food|beverage|dunkin|costa/i.test(
      text
    )
  ) {
    return 'Food';
  }

  // Housing & Rent & Maintenance
  if (
    /rent|landlord|maintenance|society|housing|flat|apartment|pg|hostel|brokerage|nobroker|nestaway|property\s*tax|maintenance\s*charge|house\s*rent|room\s*rent|estate/i.test(
      text
    )
  ) {
    return 'Housing';
  }

  // Utilities & Bills (Power, Gas, Water, Internet, Mobile)
  if (
    /electricity|power|bescom|msedcl|tneb|cesc|dhbvn|torrent|water\s*bill|gas|indane|bharat\s*gas|hp\s*gas|piped\s*gas|wifi|broadband|act\s*fibernet|airtel\s*broadband|jio\s*fiber|hathway|recharge|prepaid|postpaid|airtel|jio|vodafone|vi|bsnl|dth|tata\s*sky|tata\s*play|dish\s*tv|sun\s*direct|utility|billdesk|bbps/i.test(
      text
    )
  ) {
    return 'Utilities';
  }

  // Transport & Commute & Travel (Fuel, Cabs, Metro, Flights, Trains)
  if (
    /uber|ola|rapido|blusmart|namma\s*yatri|auto|cab|taxi|metro|delhi\s*metro|bmrc|irctc|indian\s*railway|train|flight|indigo|air\s*india|vistara|spicejet|akasa|makemytrip|goibibo|cleartrip|yatra|redbus|abhibus|petrol|diesel|fuel|cng|hpcl|bpcl|ioc|indian\s*oil|shell|toll|fastag|nhai|parking|challan|mechanic|service\s*center|car\s*wash/i.test(
      text
    )
  ) {
    return 'Transport';
  }

  // Health & Medicine & Fitness
  if (
    /hospital|clinic|doctor|pharmacy|chemist|apollo|medplus|netmeds|1mg|tata\s*1mg|pharmeasy|practo|dentist|dental|diagnostics|lal\s*path|metropolis|thyrocare|cult\.fit|cultfit|gym|fitness|yoga|opticals|lenskart|health\s*insurance|mediclaim|max\s*bupa|star\s*health|care\s*health|niva\s*bupa|medication|pharma/i.test(
      text
    )
  ) {
    return 'Health';
  }

  // Education & Courses
  if (
    /school|college|university|tuition|coaching|allen|aakash|fiitjee|byju|unacademy|udemy|coursera|edx|upgrad|scaler|course|exam|fees|books|kindle|stationery|library|pen\s*and\s*paper/i.test(
      text
    )
  ) {
    return 'Education';
  }

  // Entertainment & Subscriptions & Movies
  if (
    /netflix|spotify|amazon\s*prime|prime\s*video|hotstar|disney|apple\s*music|youtube\s*premium|pvr|inox|cinepolis|bookmyshow|movie|cinema|steam|playstation|xbox|nintendo|game|gaming|amusement|resort|club|concert/i.test(
      text
    )
  ) {
    return 'Entertainment';
  }

  // Personal Care & Salon & Grooming
  if (
    /salon|spa|parlour|barber|haircut|enrich|geometrix|urban\s*company|unisex|cosmetics|nykaa|purplle|sephora|skincare|makeup/i.test(
      text
    )
  ) {
    return 'Personal Care';
  }

  // Actual retail shopping
  if (
    /amazon|flipkart|myntra|ajio|tata\s*cliq|meesho|zara|h&m|uniqlo|westside|pantaloons|lifestyle|shoppers\s*stop|max\s*fashion|decathlon|croma|reliance\s*digital|vijay\s*sales|apple\s*store|ikea|furniture|mall|retail|store|clothing|apparel|footwear|shoes/i.test(
      text
    )
  ) {
    return 'Shopping';
  }

  // Banking / Cash / Miscellaneous
  if (/atm|cash\s*wdl|withdrawal|cheque|chq|charge|fee|tax|stamp/i.test(text)) {
    return 'Other';
  }

  return 'Other';
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Transaction Categorization endpoint
app.post('/api/categorize-transactions', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ categorized: [] });
    }

    // Try Gemini if API key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const payloadToAI = items.map((it, idx) => ({
          idx,
          id: it.id ?? `tx-${idx}`,
          text: `${it.merchant || ''} - ${it.description || ''}`.trim(),
          amount: it.amount,
          isIncome: Boolean(it.amount > 0),
        }));

        const prompt = `You are an intelligent financial ledger categorizer for bank statements.
Given this list of bank statement transactions, classify each transaction into exactly ONE of the following valid categories:
${ALLOWED_CATEGORIES.map((c) => `- "${c}"`).join('\n')}

Guidelines:
1. "Income": salary, interest, refunds, incoming payments.
2. "Investment": mutual funds (MF, SIP), Zerodha, Groww, AngelOne, stocks, fixed deposits (FD), PPF, crypto, gold.
3. "Food": Swiggy, Zomato, groceries, supermarkets, restaurants, cafes, Blinkit, Zepto, bakeries.
4. "Housing": rent, maintenance, flat payments, landlord.
5. "Utilities": electricity, water, gas, broadband, mobile recharge, DTH.
6. "Transport": fuel/petrol/diesel, Uber, Ola, Rapido, metro, flights, trains, parking, tolls.
7. "Shopping": clothing, electronics, retail goods, Amazon, Flipkart, Myntra, IKEA.
8. "Health": pharmacy, doctors, hospitals, gym, fitness, health insurance.
9. "Education": school/college fees, online courses, books.
10. "Entertainment": movies, cinema, Netflix, Spotify, streaming, games.
11. "Personal Care": salons, spa, grooming, cosmetics.
12. "Other": ATM cash, bank fees, uncategorized transfers.

CRITICAL: Do NOT classify everything as "Shopping". Groceries & food must be "Food". Transfers to brokers/funds must be "Investment". Transit and petrol must be "Transport".

Input transactions:
${JSON.stringify(payloadToAI)}

Respond with a JSON array where each object has "id" and "category".`;

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ALLOWED_CATEGORIES,
                  },
                },
                required: ['id', 'category'],
              },
            },
          },
        });

        if (geminiResponse.text) {
          const aiCategorized: Array<{ id: string; category: string }> = JSON.parse(
            geminiResponse.text
          );
          const categoryMap = new Map<string, string>();
          for (const item of aiCategorized) {
            if (item.id !== undefined && item.category) {
              categoryMap.set(String(item.id), item.category);
            }
          }

          const categorized = items.map((it, idx) => {
            const key = String(it.id ?? `tx-${idx}`);
            const matchedCategory = categoryMap.get(key);
            if (matchedCategory && ALLOWED_CATEGORIES.includes(matchedCategory)) {
              return {
                id: it.id,
                category: matchedCategory,
              };
            }
            return {
              id: it.id,
              category: ruleBasedCategorize(
                `${it.merchant || ''} ${it.description || ''}`,
                it.amount > 0
              ),
            };
          });

          return res.json({ categorized, source: 'ai' });
        }
      } catch (geminiError) {
        console.warn('Gemini categorization call error, fallback to semantic engine:', geminiError);
      }
    }

    // High accuracy fallback rule engine
    const categorized = items.map((it) => ({
      id: it.id,
      category: ruleBasedCategorize(
        `${it.merchant || ''} ${it.description || ''}`,
        it.amount > 0
      ),
    }));

    return res.json({ categorized, source: 'rules' });
  } catch (err: any) {
    console.error('Categorization error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
