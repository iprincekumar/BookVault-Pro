# Database Setup Instructions

## 🔗 Getting Your Neon Connection String

1. **Login to Neon**: Go to [neon.tech](https://neon.tech)
2. **Select your project**: BookVault Pro
3. **Find connection details**: Look for one of these sections:
   - "Connection String"
   - "Connection Details"
   - "Database" tab
   - "Settings" → "Connection"

4. **Copy the PostgreSQL connection string**. It should look like:
   ```
   postgresql://username:password@ep-xyz-123.region.aws.neon.tech/bookvault_pro?sslmode=require
   ```

## ⚙️ Setting Environment Variables in Netlify

1. **Netlify Dashboard**: [app.netlify.com](https://app.netlify.com)
2. **Your Site** → **Site Settings** → **Environment Variables**
3. **Add Variable**:
   - Key: `DATABASE_URL`
   - Value: [Your Neon connection string from above]
4. **Save** → **Deploys** tab → **Trigger Deploy**

## ✅ Testing Your Setup

After deployment with environment variables:

1. **Visit your live site**
2. **Add a test book**
3. **Refresh the page** - book should persist
4. **Open in private/incognito window** - book should still be there

If the book disappears on refresh, the database isn't connected yet.

## 🔧 Troubleshooting

**Database not connecting?**
- Check connection string is correct
- Verify environment variable name is exactly `DATABASE_URL`
- Make sure you redeployed after adding the variable
- Check Netlify deploy logs for errors

**Still using localStorage?**
- Database connection failed, app falls back to local storage
- Check browser console for error messages
- Verify Neon database is running and accessible