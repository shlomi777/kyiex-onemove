# One Move, deploy guide (precise, no terminal needed)

Goal: get the free tool live at **move.kyiex.net**. Time: about 30 to 45 minutes. You need two free accounts (GitHub and Vercel) and an Anthropic API key with billing. No software to install, everything is in the browser.

Your three files: `index.html`, `onemove.js`, `README.md`. The only structural rule: `onemove.js` must sit inside a folder named `api`. Final layout:

```
your-project/
  index.html
  api/
    onemove.js
```

Do the steps in this order. Part A first on purpose, because it sets your cost ceiling before anything can run.

---

## Part A. Anthropic API key and spend cap

This is separate from your Claude subscription. It needs its own billing.

1. Go to **console.anthropic.com** and sign in.
2. Open **Settings > Billing**. Add a payment method and a small amount of credit if prompted. This is the account that pays per use of the tool.
3. **Set the spend cap now, before anything else.** In Billing, find the monthly spend limit and set it to **$20**. This is your hard ceiling on cost. Nothing protects you better than this single setting. You can raise it later.
4. Go to **Settings > API Keys > Create Key**. Name it `kyiex-onemove`. Copy the key that appears (starts with `sk-ant-`) and paste it somewhere safe for two minutes. You will not see it again after you close the dialog.

Hold that key. You use it in Part C.

---

## Part B. Put the files on GitHub (no command line)

1. Go to **github.com**, sign in or create a free account.
2. Top right, **+ > New repository**. Name it `kyiex-onemove`. Set it to **Private**. Click **Create repository**.
3. On the empty repo page, click **uploading an existing file** (the link in the middle).
4. Drag **`index.html`** into the upload area.
5. Now add the function in its folder. In the same upload screen, the simplest way: drag `onemove.js` in, then in the file name field at the top, put `api/` in front of the name so it reads **`api/onemove.js`**. GitHub creates the folder automatically. If your screen does not let you rename on upload, instead drag the whole project folder (with `index.html` and the `api` folder already arranged on your computer as shown above) onto the page, and GitHub keeps the structure.
6. Click **Commit changes**.
7. Confirm the repo now shows `index.html` and a folder `api` containing `onemove.js`. The `README.md` is optional to upload, it does not affect the deploy.

---

## Part C. Deploy to Vercel and add the key

1. Go to **vercel.com**, click **Sign Up** or **Log In**, and choose **Continue with GitHub**. Authorize it.
2. On the dashboard, **Add New > Project**.
3. Find `kyiex-onemove` in the list and click **Import**. If you do not see it, click **Adjust GitHub App Permissions** and grant access to the repo.
4. On the configure screen, leave everything default:
   - Framework Preset: **Other**
   - Build Command: **empty**
   - Output Directory: **empty**
   - Root Directory: **leave as is**
5. Open **Environment Variables** on this same screen. Add one:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** paste your `sk-ant-...` key from Part A
   - Leave it applied to all environments.
6. Click **Deploy**. Wait for the success screen, about a minute.
7. Click the preview to open the live Vercel URL (something like `kyiex-onemove.vercel.app`). The page should load. Do not test the button yet, test after the domain is on in Part F.

Note: if you ever change the key later, you must **redeploy** for it to take effect. Env vars do not apply to an existing deploy until a new deploy runs.

---

## Part D. Connect move.kyiex.net

1. In your Vercel project, go to **Settings > Domains**.
2. Type `move.kyiex.net` and click **Add**.
3. Vercel shows a record to create. It will be a **CNAME** with a target like `cname.vercel-dns.com`. Copy that target exactly.
4. Go to **wherever you manage DNS for kyiex.net**. This is the same place you added your SPF, DKIM, and DMARC records. Add a new record:
   - **Type:** CNAME
   - **Name / Host:** `move`
   - **Value / Target:** the `cname.vercel-dns.com` value Vercel gave you
   - **TTL:** default
5. Save. Go back to Vercel and wait for the domain to flip to **Valid / Active**. Usually a few minutes, sometimes up to an hour.

This only touches the `move` subdomain. Your kyiex.net root and the Framer site are completely unaffected.

---

## Part E. Google Analytics (optional, 2 minutes)

GA is already wired into `index.html` with a placeholder. To turn it on:

1. In your GA4 account, open **Admin > Data Streams**, pick your stream, and copy the **Measurement ID** (format `G-XXXXXXXXXX`). You can reuse the same one as the kyiex.net site, or create a new stream for the tool to keep its data separate.
2. In your GitHub repo, open `index.html`, click the pencil to edit, and replace **both** instances of `G-XXXXXXXXXX` with your real ID. Commit.
3. Vercel redeploys automatically on commit.

To skip GA entirely, just delete the Google Analytics block from `index.html` instead.

---

## Part F. Test before you tell anyone

Open **https://move.kyiex.net** on your phone and run it for real, three times, once per capacity:

1. **Low.** Dump a messy real list. Confirm it picks the most startable thing, not the hardest. Confirm the voice is calm and certain, no hype, no em dashes, no exclamation points.
2. **Steady.** Confirm it picks a solid impact-to-effort move.
3. **Sharp.** Confirm it picks the hardest, highest-leverage item.

Also confirm the mechanics:
- The price and the "Get access" button appear **only after** the move shows, never before.
- There is no "give me another" button. One shot, then "Clear and start over."
- The blue matches your landing page.

If any move or reason reads like a chatbot rather than your Notion voice, send me the exact output and I will tighten the prompt.

---

## Part G. Go live

Only after the three test runs hold:

1. Switch your **X bio link** from kyiex.net to **move.kyiex.net**.
2. Switch your **Reddit profile social link** the same way.
3. Update the source-of-truth doc: free tool is live, links switched.

From here, the tool is the door. Every X reply and Reddit comment that earns a profile click lands a frozen person one tap from relief.

---

## Troubleshooting

- **Button shows "Server not configured."** The `ANTHROPIC_API_KEY` env var is missing or you added it after deploying. Add it in Vercel Settings > Environment Variables, then **Redeploy** from the Deployments tab.
- **"The signal dropped. Try once more."** Usually the key is wrong, billing is not active, or the spend cap is hit. Check the key value and that billing is live in the Anthropic console.
- **move.kyiex.net will not load.** DNS has not propagated yet, give it time. If it is still failing after an hour, recheck the CNAME: Name is `move`, Value is exactly what Vercel showed.
- **"Slow down. Try again shortly."** That is the built-in rate limit, expected if you test several times fast. Wait a few minutes.
- **The page loads but looks unstyled.** Hard refresh. The fonts load from Google, give it a second on first visit.

---

## Cost reality

On Haiku, roughly **$1.20 per 1,000 uses**. Your $20 monthly cap is the hard wall. At your traffic stage you will not come close. If the tool ever goes viral, the cap stops the bleeding automatically and you decide whether to raise it. Set and forget.

---

*One Vercel deploy and one DNS record stand between you and live.*
