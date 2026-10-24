(() => {
  const languageKey = "torLanguage";
  const translations = {
    en: {},
    fa: {
      "Tor Connect settings": "تنظیمات Tor Connect",
      "Back to Tor Connect": "بازگشت به Tor Connect",
      Settings: "تنظیمات",
      "All changes saved": "همه تغییرات ذخیره شدند",
      "Save changes": "ذخیره تغییرات",
      "Checking connection…": "در حال بررسی اتصال…",
      "Settings saved. Reconnect to apply them.": "تنظیمات ذخیره شد. برای اعمال، دوباره متصل شوید.",
      "Reconnect now": "اکنون دوباره متصل شو",
      "Settings sections": "بخش‌های تنظیمات",
      "Connection method": "روش اتصال",
      "Bridge lines": "خطوط پل",
      Appearance: "ظاهر",
      "Privacy and about": "حریم خصوصی و درباره برنامه",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "روش اتصال Tor را انتخاب کنید. خطوط پل در همین نمایه Chrome ذخیره می‌شوند.",
      "Pick how Tor reaches the network. You can switch any time.": "روش اتصال Tor به شبکه را انتخاب کنید. هر زمان می‌توانید آن را عوض کنید.",
      Snowflake: "اسنو‌فلیک",
      "Connects through volunteer proxies. No bridge lines to find or paste.": "از پراکسی‌های داوطلبانه عبور می‌کند. نیازی به پیدا کردن یا وارد کردن خط پل نیست.",
      "Bridge lines": "خطوط پل",
      "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "از پل‌هایی که خودتان اضافه می‌کنید، مانند خطوط obfs4 تور، متصل شوید.",
      "Bridge lines ": "خطوط پل ",
      "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "در حالت اسنو‌فلیک استفاده نمی‌شوند. خطوط شما ذخیره می‌مانند و با انتخاب «خطوط پل» دوباره در دسترس‌اند.",
      "Use bridge lines": "استفاده از خطوط پل",
      "Imported lines are added to the end. Ping shows TCP response time.": "خطوط واردشده به انتهای فهرست اضافه می‌شوند. پینگ، زمان پاسخ TCP را نشان می‌دهد.",
      "Ping bridges and sort by speed": "پینگ پل‌ها و مرتب‌سازی بر اساس سرعت",
      "Ping all": "پینگ همه",
      "Copy all": "کپی همه",
      "Clear all": "پاک کردن همه",
      "Add bridges": "افزودن پل",
      "Import from a file or your clipboard.": "از فایل یا کلیپ‌بورد وارد کنید.",
      "Import bridges": "وارد کردن پل‌ها",
      "From a file": "از فایل",
      "Choose a .txt with bridge lines": "یک فایل متنی شامل خطوط پل انتخاب کنید",
      "Paste from clipboard": "چسباندن از کلیپ‌بورد",
      "Copied bridge lines, one per line": "خطوط پل کپی‌شده، هر خط یک پل",
      "Need some? Request:": "پل ندارید؟ دریافت کنید:",
      "Tor bridge website": "وب‌سایت پل‌های تور",
      "Telegram bot": "ربات تلگرام",
      "Applies to the popup and this page.": "برای پنجره افزونه و این صفحه اعمال می‌شود.",
      Theme: "پوسته",
      Light: "روشن",
      Dark: "تیره",
      "Match system": "هماهنگ با سیستم",
      Language: "زبان",
      English: "English",
      Farsi: "فارسی",
      "Checking…": "در حال بررسی…",
      "Checking connection…": "در حال بررسی اتصال…",
      "Unsaved changes": "تغییرات ذخیره‌نشده",
      "Saving changes…": "در حال ذخیره تغییرات…",
      "Unsaved changes": "تغییرات ذخیره‌نشده",
      "Saving changes…": "در حال ذخیره تغییرات…",
      "Open this page in Chrome on the computer you want to set up.": "این صفحه را در Chrome روی رایانه‌ای که می‌خواهید راه‌اندازی کنید باز کنید.",
      "Download and install the Debian package. It includes Tor and connects it to Chrome.": "بسته Debian را دریافت و نصب کنید. این بسته Tor را نصب و به Chrome متصل می‌کند.",
      "Download and open the Windows installer. It includes Tor and connects it to Chrome.": "نصب‌کننده ویندوز را دریافت و باز کنید. این برنامه Tor را نصب و به Chrome متصل می‌کند.",
      "Download and open the Mac setup app. It includes Tor and connects it to Chrome.": "برنامه راه‌اندازی مک را دریافت و باز کنید. این برنامه Tor را نصب و به Chrome متصل می‌کند.",
      "Enable at least one bridge in Settings before connecting.": "پیش از اتصال، دست‌کم یک پل را در تنظیمات فعال کنید.",
      "Bridge line copied": "خط پل کپی شد",
      "Could not copy bridge line": "کپی خط پل انجام نشد",
      "The bridge is reconnecting": "پل در حال اتصال دوباره است",
      "The bridge connection is interrupted": "اتصال پل قطع شده است",
      "country unknown": "کشور نامشخص",
      "Chrome remains Chrome": "Chrome همان Chrome می‌ماند",
      "This extension does not provide Tor Browser’s fingerprinting protections, and some sites and features may not work through Tor.": "این افزونه محافظت‌های Tor Browser در برابر شناسایی اثرانگشت مرورگر را ارائه نمی‌دهد؛ بعضی وب‌سایت‌ها و قابلیت‌ها نیز ممکن است از طریق Tor کار نکنند.",
      "Read the privacy policy ↗": "مطالعه سیاست حریم خصوصی ↗",
      "Connection details": "جزئیات اتصال",
      "Bridge, transport and uptime": "پل، روش انتقال و مدت اتصال",
      "Checking Tor connection…": "در حال بررسی اتصال Tor…",
      "Waiting for Tor status…": "در انتظار وضعیت Tor…",
      "For the live Chrome log, open": "برای دیدن گزارش زنده Chrome، این صفحه را باز کنید:",
      "find Tor Connect, then click": "Tor Connect را پیدا کنید و روی",
      "Look for entries beginning": "به دنبال پیام‌هایی باشید که با این عبارت شروع می‌شوند:",
      "Set up Tor Connect": "راه‌اندازی Tor Connect",
      "ONE-TIME SETUP": "راه‌اندازی یک‌باره",
      "ONE-TIME MAC SETUP": "راه‌اندازی یک‌باره مک",
      "ONE-TIME WINDOWS SETUP": "راه‌اندازی یک‌باره ویندوز",
      "ONE-TIME LINUX SETUP": "راه‌اندازی یک‌باره لینوکس",
      "Connect Chrome through Tor": "اتصال Chrome از طریق Tor",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "یک برنامه همراه کوچک، Tor را روی این رایانه نصب و به Chrome متصل می‌کند. این راه‌اندازی فقط یک‌بار لازم است.",
      "Setup method": "روش راه‌اندازی",
      "Manual installation": "نصب دستی",
      "Setup wizard": "راه‌اندازی خودکار",
      "Install Tor Connect for this computer": "نصب Tor Connect روی این رایانه",
      "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "نصب‌کننده Tor Connect را برای رایانه‌تان دریافت و باز کنید. این برنامه Tor را نصب و به Chrome متصل می‌کند.",
      "Download the Mac setup app": "دریافت برنامه راه‌اندازی مک",
      "Download the Windows installer": "دریافت نصب‌کننده ویندوز",
      "Download the Debian/Ubuntu package": "دریافت بسته Debian/Ubuntu",
      "Installer not available yet": "نصب‌کننده هنوز در دسترس نیست",
      "If macOS blocks the setup app": "اگر macOS برنامه راه‌اندازی را مسدود کرد",
      "Apple hasn’t notarized Tor Connect Setup, so macOS may block it.": "Apple برنامه Tor Connect Setup را تأیید رسمی نکرده است؛ ممکن است macOS آن را مسدود کند.",
      "Try opening Tor Connect Setup once, then close the warning.": "یک‌بار Tor Connect Setup را باز کنید و سپس هشدار را ببندید.",
      "Open Anyway": "Open Anyway",
      "Confirm, then open Tor Connect Setup again.": "تأیید کنید و دوباره Tor Connect Setup را باز کنید.",
      "Only continue if you downloaded it from the": "فقط در صورتی ادامه دهید که آن را از اینجا دریافت کرده‌اید:",
      "official Tor Connect release": "نسخه رسمی Tor Connect",
      "Open ": "مسیر ",
      "Apple menu → System Settings → Privacy & Security": "منوی Apple → System Settings → Privacy & Security",
      " next to Tor Connect Setup.": " کنار Tor Connect Setup.",
      ", click ": "، روی ",
      ". Under ": ". در بخش ",
      ", find Tor Connect, then click ": "، Tor Connect را پیدا کنید و روی ",
      ". Look for entries beginning ": ". به دنبال پیام‌هایی باشید که با این عبارت شروع می‌شوند ",
      "Why is a separate setup app needed?": "چرا به برنامه راه‌اندازی جداگانه نیاز است؟",
      "Chrome extensions cannot install or start Tor on their own. The Tor Connect setup app installs Tor on this computer and connects it to the extension.": "افزونه‌های Chrome به‌تنهایی نمی‌توانند Tor را نصب یا اجرا کنند. برنامه راه‌اندازی Tor Connect، Tor را روی این رایانه نصب و به افزونه وصل می‌کند.",
      "If macOS says “Permission denied”": "اگر macOS پیام «اجازه دسترسی داده نشد» نشان داد",
      "First verify that the Tor bundle came from the official Tor Project and verify its signature. If it is verified, remove the quarantine flag from the installed copy in Terminal:": "ابتدا مطمئن شوید بسته Tor از Tor Project دریافت شده و امضای آن را بررسی کنید. اگر تأیید شد، در Terminal علامت قرنطینه را از نسخه نصب‌شده بردارید:",
      "This removes quarantine only from this Tor bundle; it does not disable Gatekeeper globally.": "این کار فقط قرنطینه همین بسته Tor را برمی‌دارد و Gatekeeper را به‌طور کلی غیرفعال نمی‌کند.",
      "Tor Project signature verification instructions ↗": "راهنمای بررسی امضای Tor Project ↗",
      "Install it yourself": "نصب دستی",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "بسته Tor Expert را از Tor Project دریافت کنید و سپس دستور مربوط به رایانه‌تان را اجرا کنید. این دستور اسکریپت کوچک راه‌اندازی Tor Connect را دریافت و ابزار محلی را نصب می‌کند.",
      "Download Tor Expert Bundle ↗": "دریافت بسته Tor Expert ↗",
      "Choose your operating system": "سیستم‌عامل خود را انتخاب کنید",
      "macOS": "macOS",
      Windows: "ویندوز",
      Linux: "لینوکس",
      "We couldn’t detect your operating system. Choose a tab to see its instructions.": "سیستم‌عامل شناسایی نشد. برای دیدن راهنما، یک زبانه انتخاب کنید.",
      "Mac · Terminal": "مک · ترمینال",
      "Copy the setup command and paste it into Terminal. A file window will open so you can choose the Tor Expert Bundle you downloaded.": "دستور راه‌اندازی را کپی و در Terminal جای‌گذاری کنید. پنجره انتخاب فایل باز می‌شود تا بسته Tor Expert را انتخاب کنید.",
      "Copy setup command": "کپی دستور راه‌اندازی",
      "View command": "نمایش دستور",
      "The script removes download quarantine and ad hoc signs the local Tor files macOS needs to load. No Apple developer certificate is used. Restart Chrome after setup.": "اسکریپت قرنطینه دانلود را برمی‌دارد و فایل‌های محلی Tor را با امضای موقت امضا می‌کند تا macOS بتواند آن‌ها را اجرا کند. از گواهی توسعه‌دهنده Apple استفاده نمی‌شود. پس از راه‌اندازی، Chrome را دوباره باز کنید.",
      "Windows · PowerShell": "ویندوز · PowerShell",
      "Extract the Tor Expert Bundle, then copy the setup command and paste it into PowerShell. A folder window will open so you can choose where you extracted it. Setup downloads the Chrome helper from GitHub.": "بسته Tor Expert را استخراج کنید، سپس دستور راه‌اندازی را کپی و در PowerShell جای‌گذاری کنید. پنجره انتخاب پوشه باز می‌شود تا محل استخراج را انتخاب کنید. ابزار Chrome از GitHub دریافت می‌شود.",
      "Restart Chrome after setup to load the local Tor helper.": "پس از راه‌اندازی، Chrome را دوباره باز کنید تا ابزار محلی Tor بارگذاری شود.",
      "Linux · Terminal": "لینوکس · ترمینال",
      "Extract the Tor Expert Bundle, then copy the setup command and paste it into Terminal. A folder window will open so you can choose where you extracted it. Python 3 is required.": "بسته Tor Expert را استخراج کنید، سپس دستور راه‌اندازی را کپی و در Terminal جای‌گذاری کنید. پنجره انتخاب پوشه باز می‌شود تا محل استخراج را انتخاب کنید. Python 3 لازم است.",
      "Switch to light theme": "تغییر به پوسته روشن",
      "Switch to dark theme": "تغییر به پوسته تیره",
      "Copied. Paste it into Terminal.": "کپی شد. آن را در Terminal جای‌گذاری کنید.",
      "Copied. Paste it into PowerShell.": "کپی شد. آن را در PowerShell جای‌گذاری کنید.",
      "Allow clipboard access to copy the command.": "برای کپی دستور، اجازه دسترسی به کلیپ‌بورد را بدهید.",
      "Could not copy the command. Open “View command” to copy it manually.": "کپی دستور انجام نشد. «نمایش دستور» را باز کنید و آن را دستی کپی کنید.",
      "Tor Connect": "Tor Connect",
      "Open settings": "باز کردن تنظیمات",
      Settings: "تنظیمات",
      "Open Tor controls in a new tab": "باز کردن کنترل‌های Tor در زبانه جدید",
      "Open in a tab": "باز کردن در زبانه",
      "Setup steps": "مراحل راه‌اندازی",
      "Set up Tor": "راه‌اندازی Tor",
      "Install the Tor helper once to connect through Chrome.": "برای اتصال از طریق Chrome، ابزار Tor را یک‌بار نصب کنید.",
      "Install Tor and its helper once to connect through Chrome.": "برای اتصال از طریق Chrome، Tor و ابزار همراهش را یک‌بار نصب کنید.",
      "Install helper": "نصب ابزار همراه",
      "Pick a bridge": "انتخاب پل",
      Connect: "اتصال",
      "Set up this device": "راه‌اندازی این دستگاه",
      "CONNECTION METHOD": "روش اتصال",
      "Elapsed connection time": "مدت زمان تلاش برای اتصال",
      "Connected duration": "مدت اتصال",
      "Show error details": "نمایش جزئیات خطا",
      "Saved bridges": "پل‌های ذخیره‌شده",
      "Connection method": "روش اتصال",
      "Snowflake transport": "روش انتقال اسنو‌فلیک",
      "Bridge lines": "خطوط پل",
      "Bridge selection": "انتخاب پل",
      "Copy full bridge line": "کپی خط کامل پل",
      "Reconnect using selected bridge": "اتصال دوباره با پل انتخاب‌شده",
      Reconnect: "اتصال دوباره",
      "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "پل‌ها نقاط ورودی خصوصی Tor هستند. از Tor Project پل بگیرید و سپس آن‌ها را در تنظیمات اضافه کنید.",
      "Add bridges in Settings": "افزودن پل در تنظیمات",
      "Auto-select bridge": "انتخاب خودکار پل",
      "Tries saved bridges in order": "پل‌های ذخیره‌شده را به‌ترتیب امتحان می‌کند",
      "Not connected": "متصل نیست",
      "Tap the center to try saved bridges": "برای امتحان پل‌های ذخیره‌شده، مرکز را لمس کنید",
      "Tap the center to connect": "برای اتصال، مرکز را لمس کنید",
      "Tap the center to disconnect": "برای قطع اتصال، مرکز را لمس کنید",
      "Tap the center to cancel": "برای لغو، مرکز را لمس کنید",
      "Connecting…": "در حال اتصال…",
      "Disconnecting…": "در حال قطع اتصال…",
      "Connected": "متصل",
      "Disconnect": "قطع اتصال",
      "Cancel connection": "لغو اتصال",
      "Connect to Tor": "اتصال به Tor",
      "Disconnect from Tor": "قطع اتصال از Tor",
      "Cancel Tor connection": "لغو اتصال Tor",
      "Bridge lines": "خطوط پل",
      Automatic: "خودکار",
      "No bridges yet": "هنوز پلی اضافه نشده",
      "Snowflake transport": "روش انتقال اسنو‌فلیک",
      "CONNECTED THROUGH": "اتصال از طریق",
      "TRYING BRIDGE": "در حال امتحان پل",
      "CONNECTING THROUGH": "در حال اتصال از طریق",
      "WILL CONNECT THROUGH": "روش اتصال",
      "Tries saved bridges in order": "پل‌های ذخیره‌شده را به‌ترتیب امتحان می‌کند",
      "You can switch any time.": "هر زمان می‌توانید روش را عوض کنید.",
      "A local Tor port is already in use": "درگاه محلی Tor از قبل در حال استفاده است",
      "Tor can’t access a required file": "Tor به یکی از فایل‌های لازم دسترسی ندارد",
      "Check your bridge settings": "تنظیمات پل را بررسی کنید",
      "Tor stopped before connecting": "Tor پیش از اتصال متوقف شد",
      "Couldn’t connect through this bridge": "اتصال از طریق این پل انجام نشد",
      "Tor files are missing": "فایل‌های Tor پیدا نشدند",
      "Tor helper isn’t available": "ابزار Tor در دسترس نیست",
      "Tor couldn’t connect. Try again.": "Tor متصل نشد. دوباره تلاش کنید.",
      "Another app or Chrome profile may already have a Tor connection open.": "ممکن است برنامه یا نمایه دیگری از Chrome از قبل اتصال Tor داشته باشد.",
      "Check that Tor Connect can access its installed files.": "بررسی کنید Tor Connect به فایل‌های نصب‌شده دسترسی دارد.",
      "Review the bridge lines in Settings.": "خطوط پل را در تنظیمات بررسی کنید.",
      "Tor closed before it could connect. You can try again.": "Tor پیش از اتصال بسته شد. می‌توانید دوباره تلاش کنید.",
      "Try another saved bridge or connection method.": "پل ذخیره‌شده یا روش اتصال دیگری را امتحان کنید.",
      "Run setup again to install the Tor files.": "برای نصب فایل‌های Tor، راه‌اندازی را دوباره اجرا کنید.",
      "Set up Tor Connect on this device, then restart Chrome.": "Tor Connect را روی این دستگاه راه‌اندازی و سپس Chrome را دوباره باز کنید.",
      "Try again. Open the details if it keeps happening.": "دوباره تلاش کنید. اگر مشکل ادامه داشت، جزئیات را باز کنید.",
      "Couldn’t connect. Check the error details or try again.": "اتصال انجام نشد. جزئیات خطا را ببینید یا دوباره تلاش کنید.",
      "Asking volunteer proxies to relay your traffic.": "از پراکسی‌های داوطلب درخواست می‌شود ترافیک شما را عبور دهند.",
      "Trying another volunteer proxy.": "در حال امتحان پراکسی داوطلب دیگری.",
      "The route was interrupted. Tor may retry automatically.": "مسیر اتصال قطع شد. Tor ممکن است خودکار دوباره تلاش کند.",
      "Your traffic is relayed through Snowflake proxies. The route may change.": "ترافیک شما از پراکسی‌های اسنو‌فلیک عبور می‌کند. مسیر ممکن است تغییر کند.",
      "Connect through volunteer proxies. No bridge lines to add.": "از پراکسی‌های داوطلب متصل شوید. نیازی به افزودن خطوط پل نیست.",
      "Tor may retry the Snowflake route": "Tor ممکن است مسیر اسنو‌فلیک را دوباره امتحان کند",
      "Tor may retry the bridge": "Tor ممکن است پل را دوباره امتحان کند",
      "Trying another volunteer proxy": "در حال امتحان پراکسی داوطلب دیگری",
      "Trying another bridge": "در حال امتحان پل دیگری",
      "Finding a volunteer proxy · tap to cancel": "در حال پیدا کردن پراکسی داوطلب · برای لغو لمس کنید",
      "Add bridge lines in Settings to connect this way": "برای اتصال به این روش، خطوط پل را در تنظیمات اضافه کنید",
      "Pick a bridge, then tap the center": "یک پل انتخاب کنید و سپس مرکز را لمس کنید",
      "No bridges yet. Import them from a file or your clipboard.": "هنوز پلی ندارید. آن‌ها را از فایل یا کلیپ‌بورد وارد کنید.",
      "No saved bridges": "پل ذخیره‌شده‌ای نیست",
      "Off: you choose": "خاموش: انتخاب با شماست",
      "Copy full bridge line": "کپی خط کامل پل",
      "Allow clipboard access to copy the bridge line": "برای کپی خط پل، اجازه دسترسی به کلیپ‌بورد را بدهید",
      "Bridge line copied": "خط پل کپی شد",
      "Could not copy bridge line": "کپی خط پل انجام نشد",
      "Tor status unavailable": "وضعیت Tor در دسترس نیست",
      "Connection interrupted": "اتصال قطع شد",
      "Tor setup is incomplete": "راه‌اندازی Tor کامل نشده است",
      "Tor status needs attention": "وضعیت Tor نیاز به بررسی دارد",
      "A local Tor port is already in use": "درگاه محلی Tor از قبل در حال استفاده است",
      "Connecting through volunteer proxies.": "در حال اتصال از طریق پراکسی‌های داوطلب.",
      "Trying saved bridges": "در حال امتحان پل‌های ذخیره‌شده",
      "Tor is connected": "Tor متصل است",
      "Connection unavailable": "اتصال در دسترس نیست",
      "Could not check the Tor connection. Restart Chrome and check the helper installation.": "وضعیت اتصال Tor بررسی نشد. Chrome را دوباره باز کنید و نصب ابزار همراه را بررسی کنید.",
      "Connection needs attention": "اتصال نیاز به بررسی دارد",
      "Tor could not connect.": "Tor نتوانست متصل شود.",
      "Tor is reconnecting through a bridge.": "Tor در حال اتصال دوباره از طریق پل است.",
      "Tor is disconnected.": "اتصال Tor قطع است.",
      "Tor is connecting.": "Tor در حال اتصال است.",
      "Restarting Tor with the saved settings.": "Tor با تنظیمات ذخیره‌شده دوباره راه‌اندازی می‌شود.",
      "Could not reconnect": "اتصال دوباره انجام نشد",
      "Could not stop the current connection.": "اتصال فعلی متوقف نشد.",
      "Enable at least one bridge before reconnecting.": "برای اتصال دوباره، دست‌کم یک پل را فعال کنید.",
      "Enable at least one bridge to use bridge lines.": "برای استفاده از خطوط پل، دست‌کم یک پل را فعال کنید.",
      "Keep at least one bridge enabled when using bridge lines.": "هنگام استفاده از خطوط پل، دست‌کم یک پل را فعال نگه دارید.",
      "Bridge details unavailable": "جزئیات پل در دسترس نیست",
      "Not tested": "آزمایش نشده",
      "Timed out": "مهلت اتصال تمام شد",
      "In use": "در حال استفاده",
      "Bridge is included in connections": "این پل در اتصال‌ها استفاده می‌شود",
      "Bridge is excluded from connections": "این پل از اتصال‌ها کنار گذاشته شده است",
      "Allow clipboard access to copy this bridge.": "برای کپی این پل، اجازه دسترسی به کلیپ‌بورد را بدهید.",
      "Could not copy the bridge. Check Chrome’s clipboard permission and try again.": "پل کپی نشد. اجازه دسترسی Chrome به کلیپ‌بورد را بررسی و دوباره تلاش کنید.",
      "Could not read the clipboard. Check Chrome’s clipboard permission and try again.": "کلیپ‌بورد خوانده نشد. اجازه دسترسی Chrome به کلیپ‌بورد را بررسی و دوباره تلاش کنید.",
      "Could not copy bridges. Check Chrome’s clipboard permission and try again.": "پل‌ها کپی نشدند. اجازه دسترسی Chrome به کلیپ‌بورد را بررسی و دوباره تلاش کنید.",
      "Allow clipboard access to import bridge lines.": "برای وارد کردن خطوط پل، اجازه دسترسی به کلیپ‌بورد را بدهید.",
      "Allow clipboard access to copy bridges.": "برای کپی پل‌ها، اجازه دسترسی به کلیپ‌بورد را بدهید.",
      "All bridges copied.": "همه پل‌ها کپی شدند.",
      "No bridges yet. Import them from a file or your clipboard.": "هنوز پلی ندارید. آن‌ها را از فایل یا کلیپ‌بورد وارد کنید.",
      "No additional Tor diagnostics are available.": "جزئیات بیشتری از وضعیت Tor موجود نیست.",
      "Could not save settings. Try again.": "تنظیمات ذخیره نشد. دوباره تلاش کنید.",
      "Could not save bridge changes.": "تغییرات پل ذخیره نشد.",
      "Settings saved. Reconnect now to apply them.": "تنظیمات ذخیره شد. برای اعمال، اکنون دوباره متصل شوید.",
      "Bridge lines changed. Reconnect now to apply them.": "خطوط پل تغییر کردند. برای اعمال، اکنون دوباره متصل شوید.",
      "Bridge removed and saved. Changes apply the next time you connect.": "پل حذف و ذخیره شد. تغییرات در اتصال بعدی اعمال می‌شوند.",
      "All bridges removed and saved. Changes apply the next time you connect.": "همه پل‌ها حذف و ذخیره شدند. تغییرات در اتصال بعدی اعمال می‌شوند.",
      "Sorted fastest first and saved.": "بر اساس بیشترین سرعت مرتب و ذخیره شد.",
      "Copied": "کپی شد",
      "Clipboard": "کلیپ‌بورد",
      "Could not ping bridges.": "پینگ پل‌ها انجام نشد.",
      "Choose a plain text bridge file.": "یک فایل متنی ساده شامل پل‌ها انتخاب کنید.",
      "Remove all bridge lines? This will save the change.": "همه خطوط پل حذف شوند؟ این تغییر ذخیره می‌شود.",
      "Remove Bridge": "حذف پل",
      "Currently connected bridge": "پل مورد استفاده برای اتصال",
      "Approximate bridge country": "کشور تقریبی پل",
      "Approximate country of": "کشور تقریبی",
      "Approximate country of Bridge": "کشور تقریبی پل",
      "Remove all bridge lines? This will save the change.": "همه خطوط پل حذف شوند؟ این تغییر ذخیره می‌شود.",
      "Keep at least one bridge enabled when using bridge lines.": "هنگام استفاده از خطوط پل، دست‌کم یک پل را فعال نگه دارید.",
      "No bridges yet. Import them from a file or your clipboard.": "هنوز پلی ندارید. آن‌ها را از فایل یا کلیپ‌بورد وارد کنید.",
      "Bridge lines changed. Reconnect now to apply them.": "خطوط پل تغییر کردند. برای اعمال، اکنون دوباره متصل شوید.",
      "All bridges removed and saved. Changes apply the next time you connect.": "همه پل‌ها حذف و ذخیره شدند. تغییرات در اتصال بعدی اعمال می‌شوند.",
      "Bridge removed and saved. Changes apply the next time you connect.": "پل حذف و ذخیره شد. تغییرات در اتصال بعدی اعمال می‌شوند.",
      "Connection unavailable": "اتصال در دسترس نیست",
      "Tor could not connect.": "Tor نتوانست متصل شود.",
      "Tor is reconnecting.": "Tor در حال اتصال دوباره است.",
      "Tor is connecting.": "Tor در حال اتصال است.",
      "Tor is disconnected.": "اتصال Tor قطع است.",
      "Restarting Tor with the saved settings.": "Tor با تنظیمات ذخیره‌شده دوباره راه‌اندازی می‌شود.",
      "Tor is connected.": "Tor متصل است.",
      "Bridge is currently connected": "این پل اکنون در حال اتصال است",
      "Currently connected bridge": "پل مورد استفاده برای اتصال",
      "Could not stop the current connection.": "اتصال فعلی متوقف نشد.",
      "Ping": "پینگ",
      "Use Bridge": "استفاده از پل",
      "Copy Bridge": "کپی پل",
      "Bridge details unavailable": "جزئیات پل در دسترس نیست"
    },
    de: {
      "Tor Connect settings": "Tor Connect-Einstellungen", "Back to Tor Connect": "Zurück zu Tor Connect", Settings: "Einstellungen",
      "All changes saved": "Alle Änderungen gespeichert", "Save changes": "Änderungen speichern", "Checking connection…": "Verbindung wird geprüft …",
      "Settings saved. Reconnect to apply them.": "Einstellungen gespeichert. Stelle die Verbindung erneut her, um sie anzuwenden.", "Reconnect now": "Jetzt erneut verbinden",
      "Settings sections": "Einstellungsbereiche", "Connection method": "Verbindungsmethode", "Bridge lines": "Bridge-Zeilen", Appearance: "Darstellung",
      "Privacy and about": "Datenschutz und Info", "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "Wähle aus, wie Tor eine Verbindung herstellt. Deine Bridge-Zeilen bleiben in diesem Chrome-Profil.",
      "Pick how Tor reaches the network. You can switch any time.": "Wähle, wie Tor das Netzwerk erreicht. Du kannst jederzeit wechseln.", Snowflake: "Snowflake",
      "Connects through volunteer proxies. No bridge lines to find or paste.": "Verbindung über freiwillige Proxys. Du musst keine Bridge-Zeilen suchen oder einfügen.",
      "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "Verbinde dich über Bridges, die du selbst hinzufügst, zum Beispiel obfs4-Zeilen von Tor.",
      "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "Wird mit Snowflake nicht verwendet. Deine Zeilen bleiben gespeichert und erscheinen wieder, wenn du Bridge-Zeilen auswählst.",
      "Use bridge lines": "Bridge-Zeilen verwenden", "Imported lines are added to the end. Ping shows TCP response time.": "Importierte Zeilen werden angehängt. Ping zeigt die TCP-Antwortzeit.",
      "Ping bridges and sort by speed": "Bridges anpingen und nach Geschwindigkeit sortieren", "Ping all": "Alle anpingen", "Copy all": "Alle kopieren", "Clear all": "Alle löschen",
      "Add bridges": "Bridges hinzufügen", "Import from a file or your clipboard.": "Aus einer Datei oder Zwischenablage importieren.", "Import bridges": "Bridges importieren",
      "From a file": "Aus einer Datei", "Choose a .txt with bridge lines": "Eine .txt-Datei mit Bridge-Zeilen auswählen", "Paste from clipboard": "Aus Zwischenablage einfügen",
      "Need some? Request:": "Du brauchst Bridges? Hier kannst du sie anfordern:", "Tor bridge website": "Tor-Bridge-Website", "Telegram bot": "Telegram-Bot",
      "Applies to the popup and this page.": "Gilt für das Popup und diese Seite.", Theme: "Design", Light: "Hell", Dark: "Dunkel", "Match system": "Systemeinstellung",
      Language: "Sprache", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome bleibt Chrome", "Read the privacy policy ↗": "Datenschutzerklärung lesen ↗", "Connection details": "Verbindungsdetails", "Bridge, transport and uptime": "Bridge, Transport und Laufzeit",
      "Set up Tor Connect": "Tor Connect einrichten", "ONE-TIME SETUP": "EINMALIGE EINRICHTUNG", "Connect Chrome through Tor": "Chrome über Tor verbinden",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "Eine kleine Begleit-App installiert Tor auf diesem Computer und verbindet es mit Chrome. Die Einrichtung ist nur einmal erforderlich.",
      "Setup method": "Einrichtungsmethode", "Manual installation": "Manuelle Installation", "Setup wizard": "Einrichtungsassistent", "Install Tor Connect for this computer": "Tor Connect auf diesem Computer installieren",
      "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "Lade das Tor-Connect-Installationsprogramm für deinen Computer herunter und öffne es. Es installiert Tor und verbindet es mit Chrome.",
      "Download the Mac setup app": "Mac-Setup-App herunterladen", "Download the Windows installer": "Windows-Installationsprogramm herunterladen", "Download the Debian/Ubuntu package": "Debian-/Ubuntu-Paket herunterladen", "Installer not available yet": "Installationsprogramm noch nicht verfügbar", "Install it yourself": "Selbst installieren",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "Lade das Tor Expert Bundle vom Tor Project herunter und führe dann den Befehl für deinen Computer aus. Der Befehl lädt das Tor-Connect-Setup-Skript herunter und installiert den lokalen Helfer.",
      "Download Tor Expert Bundle ↗": "Tor Expert Bundle herunterladen ↗", "Choose your operating system": "Betriebssystem auswählen", macOS: "macOS", Windows: "Windows", Linux: "Linux",
      "We couldn’t detect your operating system. Choose a tab to see its instructions.": "Dein Betriebssystem konnte nicht erkannt werden. Wähle einen Tab für die Anleitung.", "Mac · Terminal": "Mac · Terminal", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Terminal",
      "Copy setup command": "Setup-Befehl kopieren", "View command": "Befehl anzeigen", "Restart Chrome after setup to load the local Tor helper.": "Starte Chrome nach der Einrichtung neu, damit der lokale Tor-Helfer geladen wird.",
      "Open settings": "Einstellungen öffnen", "Open in a tab": "In einem Tab öffnen", "Setup steps": "Einrichtungsschritte", "Set up Tor": "Tor einrichten", "Install helper": "Helfer installieren", "Pick a bridge": "Bridge auswählen", Connect: "Verbinden",
      "CONNECTION METHOD": "VERBINDUNGSMETHODE", "Elapsed connection time": "Verbindungsversuchsdauer", "Connected duration": "Verbindungsdauer", "Show error details": "Fehlerdetails anzeigen", "Saved bridges": "Gespeicherte Bridges", "Bridge selection": "Bridge-Auswahl", Reconnect: "Erneut verbinden",
      "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "Bridges sind private Tor-Einstiegspunkte. Fordere sie beim Tor Project an und füge sie dann in den Einstellungen hinzu.", "Add bridges in Settings": "Bridges in den Einstellungen hinzufügen", "Auto-select bridge": "Bridge automatisch auswählen", "Tries saved bridges in order": "Gespeicherte Bridges werden der Reihe nach ausprobiert",
      "Not connected": "Nicht verbunden", "Tap the center to try saved bridges": "Tippe auf die Mitte, um gespeicherte Bridges auszuprobieren", "Tap the center to connect": "Tippe zum Verbinden auf die Mitte", "Tap the center to disconnect": "Tippe zum Trennen auf die Mitte", "Tap the center to cancel": "Tippe zum Abbrechen auf die Mitte",
      "Connecting…": "Verbindung wird hergestellt …", "Disconnecting…": "Verbindung wird getrennt …", Connected: "Verbunden", Disconnect: "Trennen", "Cancel connection": "Verbindung abbrechen", "Connect to Tor": "Mit Tor verbinden", "Disconnect from Tor": "Tor-Verbindung trennen", Automatic: "Automatisch", "No bridges yet": "Noch keine Bridges",
      "Tor couldn’t connect. Try again.": "Tor konnte keine Verbindung herstellen. Versuche es erneut.", "Another app or Chrome profile may already have a Tor connection open.": "Möglicherweise ist in einer anderen App oder einem anderen Chrome-Profil bereits eine Tor-Verbindung aktiv.", "Check that Tor Connect can access its installed files.": "Prüfe, ob Tor Connect auf die installierten Dateien zugreifen kann.", "Review the bridge lines in Settings.": "Überprüfe die Bridge-Zeilen in den Einstellungen.", "Couldn’t connect. Check the error details or try again.": "Verbindung fehlgeschlagen. Prüfe die Fehlerdetails oder versuche es erneut.",
      "Asking volunteer proxies to relay your traffic.": "Freiwillige Proxys werden gebeten, deinen Datenverkehr weiterzuleiten.", "Trying another volunteer proxy.": "Ein anderer freiwilliger Proxy wird ausprobiert.", "The route was interrupted. Tor may retry automatically.": "Die Verbindung wurde unterbrochen. Tor versucht es möglicherweise automatisch erneut.", "Your traffic is relayed through Snowflake proxies. The route may change.": "Dein Datenverkehr wird über Snowflake-Proxys weitergeleitet. Die Route kann sich ändern.",
      "Tor status unavailable": "Tor-Status nicht verfügbar", "Connection interrupted": "Verbindung unterbrochen", "Tor setup is incomplete": "Tor-Einrichtung unvollständig", "Tor status needs attention": "Tor-Status erfordert Aufmerksamkeit", "Tor is connected": "Tor ist verbunden", "Connection unavailable": "Verbindung nicht verfügbar", "Connection needs attention": "Verbindung erfordert Aufmerksamkeit", "Could not reconnect": "Erneute Verbindung fehlgeschlagen", "Could not stop the current connection.": "Die aktuelle Verbindung konnte nicht beendet werden.",
      "Could not save settings. Try again.": "Einstellungen konnten nicht gespeichert werden. Versuche es erneut.", "Could not save bridge changes.": "Bridge-Änderungen konnten nicht gespeichert werden.", "Settings saved. Reconnect now to apply them.": "Einstellungen gespeichert. Stelle jetzt die Verbindung erneut her, um sie anzuwenden.", "Bridge lines changed. Reconnect now to apply them.": "Bridge-Zeilen geändert. Stelle jetzt die Verbindung erneut her, um die Änderungen anzuwenden.", "Copied": "Kopiert", Clipboard: "Zwischenablage", Ping: "Ping", "Use Bridge": "Bridge verwenden", "Copy Bridge": "Bridge kopieren"
    },
    es: {
      "Tor Connect settings": "Configuración de Tor Connect", "Back to Tor Connect": "Volver a Tor Connect", Settings: "Configuración", "All changes saved": "Todos los cambios guardados", "Save changes": "Guardar cambios", "Checking connection…": "Comprobando conexión…",
      "Settings saved. Reconnect to apply them.": "Configuración guardada. Vuelve a conectar para aplicarla.", "Reconnect now": "Volver a conectar ahora", "Settings sections": "Secciones de configuración", "Connection method": "Método de conexión", "Bridge lines": "Líneas de puente", Appearance: "Apariencia", "Privacy and about": "Privacidad e información",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "Elige cómo se conecta Tor. Tus líneas de puente permanecen en este perfil de Chrome.", "Pick how Tor reaches the network. You can switch any time.": "Elige cómo se conecta Tor a la red. Puedes cambiarlo cuando quieras.", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "Se conecta mediante proxies voluntarios. No tienes que buscar ni pegar líneas de puente.", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "Conéctate mediante puentes que añadas, como las líneas obfs4 de Tor.", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "No se usa con Snowflake. Tus líneas se conservan y vuelven al cambiar a Líneas de puente.", "Use bridge lines": "Usar líneas de puente",
      "Imported lines are added to the end. Ping shows TCP response time.": "Las líneas importadas se añaden al final. El ping muestra el tiempo de respuesta TCP.", "Ping bridges and sort by speed": "Medir los puentes y ordenarlos por velocidad", "Ping all": "Medir todos", "Copy all": "Copiar todos", "Clear all": "Borrar todos", "Add bridges": "Añadir puentes", "Import from a file or your clipboard.": "Importa desde un archivo o el portapapeles.", "Import bridges": "Importar puentes", "From a file": "Desde un archivo", "Choose a .txt with bridge lines": "Elige un archivo .txt con líneas de puente", "Paste from clipboard": "Pegar desde el portapapeles", "Need some? Request:": "¿Necesitas puentes? Solicítalos:", "Tor bridge website": "Sitio de puentes de Tor", "Telegram bot": "Bot de Telegram",
      "Applies to the popup and this page.": "Se aplica a la ventana emergente y a esta página.", Theme: "Tema", Light: "Claro", Dark: "Oscuro", "Match system": "Usar el del sistema", Language: "Idioma", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome sigue siendo Chrome", "Read the privacy policy ↗": "Leer la política de privacidad ↗", "Connection details": "Detalles de conexión", "Bridge, transport and uptime": "Puente, transporte y duración", "Set up Tor Connect": "Configurar Tor Connect", "ONE-TIME SETUP": "CONFIGURACIÓN INICIAL", "Connect Chrome through Tor": "Conecta Chrome a través de Tor",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "Una pequeña aplicación complementaria instala Tor en este equipo y lo conecta con Chrome. Solo tienes que configurarla una vez.", "Setup method": "Método de configuración", "Manual installation": "Instalación manual", "Setup wizard": "Asistente de configuración", "Install Tor Connect for this computer": "Instalar Tor Connect en este equipo", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "Descarga y abre el instalador de Tor Connect para tu equipo. Instala Tor y lo conecta con Chrome.", "Download the Mac setup app": "Descargar la aplicación de configuración para Mac", "Download the Windows installer": "Descargar el instalador para Windows", "Download the Debian/Ubuntu package": "Descargar el paquete para Debian/Ubuntu", "Installer not available yet": "Instalador aún no disponible", "Install it yourself": "Instálalo manualmente",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "Descarga el Tor Expert Bundle del Tor Project y ejecuta el comando correspondiente a tu equipo. El comando descarga el pequeño script de configuración de Tor Connect e instala el asistente local.", "Download Tor Expert Bundle ↗": "Descargar Tor Expert Bundle ↗", "Choose your operating system": "Elige tu sistema operativo", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "No se pudo detectar tu sistema operativo. Elige una pestaña para ver las instrucciones.", "Mac · Terminal": "Mac · Terminal", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Terminal", "Copy setup command": "Copiar comando de configuración", "View command": "Ver comando", "Restart Chrome after setup to load the local Tor helper.": "Reinicia Chrome después de la configuración para cargar el asistente local de Tor.",
      "Open settings": "Abrir configuración", "Open in a tab": "Abrir en una pestaña", "Setup steps": "Pasos de configuración", "Set up Tor": "Configurar Tor", "Install helper": "Instalar asistente", "Pick a bridge": "Elegir un puente", Connect: "Conectar", "CONNECTION METHOD": "MÉTODO DE CONEXIÓN", "Elapsed connection time": "Tiempo intentando conectar", "Connected duration": "Duración de la conexión", "Show error details": "Mostrar detalles del error", "Saved bridges": "Puentes guardados", "Bridge selection": "Selección de puente", Reconnect: "Reconectar", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "Los puentes son puntos de entrada privados a Tor. Solicítalos al Tor Project y añádelos en Configuración.", "Add bridges in Settings": "Añadir puentes en Configuración", "Auto-select bridge": "Seleccionar puente automáticamente", "Tries saved bridges in order": "Prueba los puentes guardados en orden", "Not connected": "Sin conexión", "Tap the center to try saved bridges": "Toca el centro para probar los puentes guardados", "Tap the center to connect": "Toca el centro para conectar", "Tap the center to disconnect": "Toca el centro para desconectar", "Tap the center to cancel": "Toca el centro para cancelar", "Connecting…": "Conectando…", "Disconnecting…": "Desconectando…", Connected: "Conectado", Disconnect: "Desconectar", "Cancel connection": "Cancelar conexión", "Connect to Tor": "Conectar a Tor", "Disconnect from Tor": "Desconectar de Tor", Automatic: "Automático", "No bridges yet": "Aún no hay puentes",
      "Tor couldn’t connect. Try again.": "Tor no pudo conectarse. Inténtalo de nuevo.", "Another app or Chrome profile may already have a Tor connection open.": "Es posible que otra aplicación o perfil de Chrome ya tenga una conexión Tor abierta.", "Check that Tor Connect can access its installed files.": "Comprueba que Tor Connect pueda acceder a sus archivos instalados.", "Review the bridge lines in Settings.": "Revisa las líneas de puente en Configuración.", "Couldn’t connect. Check the error details or try again.": "No se pudo conectar. Revisa los detalles del error o inténtalo de nuevo.", "Asking volunteer proxies to relay your traffic.": "Solicitando a proxies voluntarios que retransmitan tu tráfico.", "Trying another volunteer proxy.": "Probando otro proxy voluntario.", "The route was interrupted. Tor may retry automatically.": "La ruta se interrumpió. Tor puede volver a intentarlo automáticamente.", "Your traffic is relayed through Snowflake proxies. The route may change.": "Tu tráfico se retransmite mediante proxies Snowflake. La ruta puede cambiar.", "Tor status unavailable": "Estado de Tor no disponible", "Connection interrupted": "Conexión interrumpida", "Tor setup is incomplete": "La configuración de Tor está incompleta", "Tor status needs attention": "El estado de Tor requiere atención", "Tor is connected": "Tor está conectado", "Connection unavailable": "Conexión no disponible", "Connection needs attention": "La conexión requiere atención", "Could not reconnect": "No se pudo reconectar", "Could not stop the current connection.": "No se pudo detener la conexión actual.", "Could not save settings. Try again.": "No se pudo guardar la configuración. Inténtalo de nuevo.", "Could not save bridge changes.": "No se pudieron guardar los cambios de los puentes.", "Settings saved. Reconnect now to apply them.": "Configuración guardada. Reconecta ahora para aplicarla.", "Bridge lines changed. Reconnect now to apply them.": "Líneas de puente modificadas. Reconecta ahora para aplicar los cambios.", Copied: "Copiado", Clipboard: "Portapapeles", Ping: "Ping", "Use Bridge": "Usar puente", "Copy Bridge": "Copiar puente"
    },
    ar: {
      "Tor Connect settings": "إعدادات Tor Connect", "Back to Tor Connect": "العودة إلى Tor Connect", Settings: "الإعدادات", "All changes saved": "تم حفظ جميع التغييرات", "Save changes": "حفظ التغييرات", "Checking connection…": "جارٍ التحقق من الاتصال…",
      "Settings saved. Reconnect to apply them.": "تم حفظ الإعدادات. أعد الاتصال لتطبيقها.", "Reconnect now": "أعد الاتصال الآن", "Settings sections": "أقسام الإعدادات", "Connection method": "طريقة الاتصال", "Bridge lines": "أسطر الجسور", Appearance: "المظهر", "Privacy and about": "الخصوصية وحول التطبيق",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "اختر طريقة اتصال Tor. تبقى أسطر الجسور في ملف Chrome الشخصي هذا.", "Pick how Tor reaches the network. You can switch any time.": "اختر كيفية وصول Tor إلى الشبكة. يمكنك التبديل في أي وقت.", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "يتصل عبر وكلاء متطوعين. لا حاجة للبحث عن أسطر الجسور أو لصقها.", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "اتصل عبر جسور تضيفها بنفسك، مثل أسطر obfs4 من Tor.", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "لا تُستخدم مع Snowflake. تُحفظ أسطرك وتعود عند التبديل إلى أسطر الجسور.", "Use bridge lines": "استخدام أسطر الجسور", "Imported lines are added to the end. Ping shows TCP response time.": "تُضاف الأسطر المستوردة إلى النهاية. يعرض Ping زمن استجابة TCP.", "Ping bridges and sort by speed": "اختبار الجسور وترتيبها حسب السرعة", "Ping all": "اختبار الكل", "Copy all": "نسخ الكل", "Clear all": "مسح الكل", "Add bridges": "إضافة جسور", "Import from a file or your clipboard.": "استيراد من ملف أو الحافظة.", "Import bridges": "استيراد الجسور", "From a file": "من ملف", "Choose a .txt with bridge lines": "اختر ملف .txt يحتوي على أسطر الجسور", "Paste from clipboard": "لصق من الحافظة", "Need some? Request:": "هل تحتاج إلى جسور؟ اطلبها من:", "Tor bridge website": "موقع جسور Tor", "Telegram bot": "بوت Telegram",
      "Applies to the popup and this page.": "يُطبّق على النافذة المنبثقة وهذه الصفحة.", Theme: "السمة", Light: "فاتح", Dark: "داكن", "Match system": "مطابقة النظام", Language: "اللغة", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "يبقى Chrome كما هو", "Read the privacy policy ↗": "اقرأ سياسة الخصوصية ↗", "Connection details": "تفاصيل الاتصال", "Bridge, transport and uptime": "الجسر ووسيلة النقل ومدة التشغيل", "Set up Tor Connect": "إعداد Tor Connect", "ONE-TIME SETUP": "إعداد لمرة واحدة", "Connect Chrome through Tor": "اتصل عبر Tor باستخدام Chrome",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "يثبّت تطبيق مساعد صغير Tor على هذا الكمبيوتر ويربطه بـ Chrome. يلزم إعداد التطبيق مرة واحدة فقط.", "Setup method": "طريقة الإعداد", "Manual installation": "التثبيت اليدوي", "Setup wizard": "معالج الإعداد", "Install Tor Connect for this computer": "تثبيت Tor Connect على هذا الكمبيوتر", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "نزّل مُثبّت Tor Connect المناسب لجهازك وافتحه. سيُثبّت Tor ويربطه بـ Chrome.", "Download the Mac setup app": "تنزيل تطبيق إعداد Mac", "Download the Windows installer": "تنزيل مُثبّت Windows", "Download the Debian/Ubuntu package": "تنزيل حزمة Debian/Ubuntu", "Installer not available yet": "المُثبّت غير متاح بعد", "Install it yourself": "التثبيت بنفسك",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "نزّل حزمة Tor Expert Bundle من Tor Project، ثم شغّل الأمر المناسب لجهازك. ينزّل الأمر سكربت إعداد Tor Connect الصغير ويثبّت الأداة المحلية.", "Download Tor Expert Bundle ↗": "تنزيل Tor Expert Bundle ↗", "Choose your operating system": "اختر نظام التشغيل", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "تعذّر اكتشاف نظام التشغيل. اختر علامة تبويب لعرض التعليمات.", "Mac · Terminal": "Mac · Terminal", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Terminal", "Copy setup command": "نسخ أمر الإعداد", "View command": "عرض الأمر", "Restart Chrome after setup to load the local Tor helper.": "أعد تشغيل Chrome بعد الإعداد لتحميل أداة Tor المحلية.",
      "Open settings": "فتح الإعدادات", "Open in a tab": "فتح في علامة تبويب", "Setup steps": "خطوات الإعداد", "Set up Tor": "إعداد Tor", "Install helper": "تثبيت الأداة المساعدة", "Pick a bridge": "اختر جسراً", Connect: "اتصال", "CONNECTION METHOD": "طريقة الاتصال", "Elapsed connection time": "الوقت المنقضي للاتصال", "Connected duration": "مدة الاتصال", "Show error details": "عرض تفاصيل الخطأ", "Saved bridges": "الجسور المحفوظة", "Bridge selection": "اختيار الجسر", Reconnect: "إعادة الاتصال", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "الجسور نقاط دخول خاصة إلى Tor. اطلبها من Tor Project ثم أضفها في الإعدادات.", "Add bridges in Settings": "أضف جسوراً في الإعدادات", "Auto-select bridge": "اختيار الجسر تلقائياً", "Tries saved bridges in order": "يجرّب الجسور المحفوظة بالترتيب", "Not connected": "غير متصل", "Tap the center to try saved bridges": "اضغط على الوسط لتجربة الجسور المحفوظة", "Tap the center to connect": "اضغط على الوسط للاتصال", "Tap the center to disconnect": "اضغط على الوسط لقطع الاتصال", "Tap the center to cancel": "اضغط على الوسط للإلغاء", "Connecting…": "جارٍ الاتصال…", "Disconnecting…": "جارٍ قطع الاتصال…", Connected: "متصل", Disconnect: "قطع الاتصال", "Cancel connection": "إلغاء الاتصال", "Connect to Tor": "الاتصال بـ Tor", "Disconnect from Tor": "قطع الاتصال بـ Tor", Automatic: "تلقائي", "No bridges yet": "لا توجد جسور بعد",
      "Tor couldn’t connect. Try again.": "تعذّر على Tor الاتصال. حاول مجدداً.", "Another app or Chrome profile may already have a Tor connection open.": "قد يكون تطبيق آخر أو ملف Chrome شخصي آخر قد بدأ اتصال Tor بالفعل.", "Check that Tor Connect can access its installed files.": "تحقق من إمكانية وصول Tor Connect إلى ملفاته المثبتة.", "Review the bridge lines in Settings.": "راجع أسطر الجسور في الإعدادات.", "Couldn’t connect. Check the error details or try again.": "تعذّر الاتصال. راجع تفاصيل الخطأ أو حاول مجدداً.", "Asking volunteer proxies to relay your traffic.": "جارٍ طلب تمرير حركة المرور عبر وكلاء متطوعين.", "Trying another volunteer proxy.": "جارٍ تجربة وكيل متطوع آخر.", "The route was interrupted. Tor may retry automatically.": "انقطع المسار. قد يعيد Tor المحاولة تلقائياً.", "Your traffic is relayed through Snowflake proxies. The route may change.": "يتم تمرير حركة مرورك عبر وكلاء Snowflake. قد يتغير المسار.", "Tor status unavailable": "حالة Tor غير متاحة", "Connection interrupted": "انقطع الاتصال", "Tor setup is incomplete": "إعداد Tor غير مكتمل", "Tor status needs attention": "تحتاج حالة Tor إلى مراجعة", "Tor is connected": "Tor متصل", "Connection unavailable": "الاتصال غير متاح", "Connection needs attention": "يتطلب الاتصال مراجعة", "Could not reconnect": "تعذّرت إعادة الاتصال", "Could not stop the current connection.": "تعذّر إيقاف الاتصال الحالي.", "Could not save settings. Try again.": "تعذّر حفظ الإعدادات. حاول مجدداً.", "Could not save bridge changes.": "تعذّر حفظ تغييرات الجسور.", "Settings saved. Reconnect now to apply them.": "تم حفظ الإعدادات. أعد الاتصال الآن لتطبيقها.", "Bridge lines changed. Reconnect now to apply them.": "تغيّرت أسطر الجسور. أعد الاتصال الآن لتطبيق التغييرات.", Copied: "تم النسخ", Clipboard: "الحافظة", Ping: "Ping", "Use Bridge": "استخدام الجسر", "Copy Bridge": "نسخ الجسر"
    },
    zh: {
      "Tor Connect settings": "Tor Connect 设置", "Back to Tor Connect": "返回 Tor Connect", Settings: "设置", "All changes saved": "已保存所有更改", "Save changes": "保存更改", "Checking connection…": "正在检查连接…", "Settings saved. Reconnect to apply them.": "设置已保存。请重新连接以应用。", "Reconnect now": "立即重新连接", "Settings sections": "设置类别", "Connection method": "连接方式", "Bridge lines": "网桥线路", Appearance: "外观", "Privacy and about": "隐私与关于",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "选择 Tor 的连接方式。网桥线路仅保存在此 Chrome 配置文件中。", "Pick how Tor reaches the network. You can switch any time.": "选择 Tor 接入网络的方式。你可以随时切换。", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "通过志愿者代理连接，无需查找或粘贴网桥线路。", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "通过你自行添加的网桥连接，例如 Tor 提供的 obfs4 线路。", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "Snowflake 模式不会使用网桥线路。线路会保留，切换回网桥模式后即可使用。", "Use bridge lines": "使用网桥线路", "Imported lines are added to the end. Ping shows TCP response time.": "导入的线路会添加到列表末尾。Ping 显示 TCP 响应时间。", "Ping bridges and sort by speed": "测试网桥并按速度排序", "Ping all": "全部测试", "Copy all": "全部复制", "Clear all": "全部清除", "Add bridges": "添加网桥", "Import from a file or your clipboard.": "从文件或剪贴板导入。", "Import bridges": "导入网桥", "From a file": "从文件导入", "Choose a .txt with bridge lines": "选择包含网桥线路的 .txt 文件", "Paste from clipboard": "从剪贴板粘贴", "Need some? Request:": "需要网桥？请通过以下方式获取：", "Tor bridge website": "Tor 网桥网站", "Telegram bot": "Telegram 机器人",
      "Applies to the popup and this page.": "应用于弹出窗口和此页面。", Theme: "主题", Light: "浅色", Dark: "深色", "Match system": "跟随系统", Language: "语言", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome 仍是 Chrome", "Read the privacy policy ↗": "阅读隐私政策 ↗", "Connection details": "连接详情", "Bridge, transport and uptime": "网桥、传输方式和运行时间", "Set up Tor Connect": "设置 Tor Connect", "ONE-TIME SETUP": "一次性设置", "Connect Chrome through Tor": "通过 Tor 连接 Chrome",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "小型配套应用会在此电脑上安装 Tor 并将其连接到 Chrome。只需设置一次。", "Setup method": "设置方式", "Manual installation": "手动安装", "Setup wizard": "安装向导", "Install Tor Connect for this computer": "在此电脑上安装 Tor Connect", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "下载并打开适用于此电脑的 Tor Connect 安装程序。它会安装 Tor 并将其连接到 Chrome。", "Download the Mac setup app": "下载 Mac 设置应用", "Download the Windows installer": "下载 Windows 安装程序", "Download the Debian/Ubuntu package": "下载 Debian/Ubuntu 软件包", "Installer not available yet": "安装程序暂不可用", "Install it yourself": "手动安装",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "从 Tor Project 下载 Tor Expert Bundle，然后运行适用于此电脑的命令。该命令会下载 Tor Connect 设置脚本并安装本地辅助程序。", "Download Tor Expert Bundle ↗": "下载 Tor Expert Bundle ↗", "Choose your operating system": "选择操作系统", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "无法识别你的操作系统。请选择一个标签查看说明。", "Mac · Terminal": "Mac · 终端", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · 终端", "Copy setup command": "复制设置命令", "View command": "查看命令", "Restart Chrome after setup to load the local Tor helper.": "设置完成后请重启 Chrome，以加载本地 Tor 辅助程序。",
      "Open settings": "打开设置", "Open in a tab": "在新标签页中打开", "Setup steps": "设置步骤", "Set up Tor": "设置 Tor", "Install helper": "安装辅助程序", "Pick a bridge": "选择网桥", Connect: "连接", "CONNECTION METHOD": "连接方式", "Elapsed connection time": "连接尝试时间", "Connected duration": "已连接时长", "Show error details": "显示错误详情", "Saved bridges": "已保存的网桥", "Bridge selection": "网桥选择", Reconnect: "重新连接", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "网桥是 Tor 的私有入口。请向 Tor Project 申请网桥，然后在设置中添加。", "Add bridges in Settings": "在设置中添加网桥", "Auto-select bridge": "自动选择网桥", "Tries saved bridges in order": "按顺序尝试已保存的网桥", "Not connected": "未连接", "Tap the center to try saved bridges": "点击中心以尝试已保存的网桥", "Tap the center to connect": "点击中心以连接", "Tap the center to disconnect": "点击中心以断开连接", "Tap the center to cancel": "点击中心以取消", "Connecting…": "正在连接…", "Disconnecting…": "正在断开…", Connected: "已连接", Disconnect: "断开连接", "Cancel connection": "取消连接", "Connect to Tor": "连接到 Tor", "Disconnect from Tor": "断开 Tor 连接", Automatic: "自动", "No bridges yet": "尚无网桥",
      "Tor couldn’t connect. Try again.": "Tor 无法连接，请重试。", "Another app or Chrome profile may already have a Tor connection open.": "其他应用或 Chrome 配置文件可能已打开 Tor 连接。", "Check that Tor Connect can access its installed files.": "请检查 Tor Connect 是否可以访问已安装的文件。", "Review the bridge lines in Settings.": "请检查设置中的网桥线路。", "Couldn’t connect. Check the error details or try again.": "连接失败。请查看错误详情或重试。", "Asking volunteer proxies to relay your traffic.": "正在请求志愿者代理转发你的流量。", "Trying another volunteer proxy.": "正在尝试另一个志愿者代理。", "The route was interrupted. Tor may retry automatically.": "连接路线已中断。Tor 可能会自动重试。", "Your traffic is relayed through Snowflake proxies. The route may change.": "你的流量通过 Snowflake 代理转发，连接路线可能会变化。", "Tor status unavailable": "Tor 状态不可用", "Connection interrupted": "连接中断", "Tor setup is incomplete": "Tor 设置未完成", "Tor status needs attention": "Tor 状态需要处理", "Tor is connected": "Tor 已连接", "Connection unavailable": "连接不可用", "Connection needs attention": "连接需要处理", "Could not reconnect": "无法重新连接", "Could not stop the current connection.": "无法停止当前连接。", "Could not save settings. Try again.": "无法保存设置，请重试。", "Could not save bridge changes.": "无法保存网桥更改。", "Settings saved. Reconnect now to apply them.": "设置已保存。请立即重新连接以应用。", "Bridge lines changed. Reconnect now to apply them.": "网桥线路已更改。请立即重新连接以应用。", Copied: "已复制", Clipboard: "剪贴板", Ping: "Ping", "Use Bridge": "使用网桥", "Copy Bridge": "复制网桥"
    },
    hi: {
      "Tor Connect settings": "Tor Connect सेटिंग्स", "Back to Tor Connect": "Tor Connect पर वापस जाएँ", Settings: "सेटिंग्स", "All changes saved": "सभी बदलाव सहेजे गए", "Save changes": "बदलाव सहेजें", "Checking connection…": "कनेक्शन जाँचा जा रहा है…", "Settings saved. Reconnect to apply them.": "सेटिंग्स सहेजी गईं। लागू करने के लिए फिर से कनेक्ट करें।", "Reconnect now": "अभी फिर से कनेक्ट करें", "Settings sections": "सेटिंग्स अनुभाग", "Connection method": "कनेक्शन का तरीका", "Bridge lines": "ब्रिज लाइनें", Appearance: "दिखावट", "Privacy and about": "गोपनीयता और जानकारी",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "चुनें कि Tor कैसे कनेक्ट हो। आपकी ब्रिज लाइनें इसी Chrome प्रोफ़ाइल में रहती हैं।", "Pick how Tor reaches the network. You can switch any time.": "चुनें कि Tor नेटवर्क तक कैसे पहुँचे। आप कभी भी बदल सकते हैं।", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "स्वयंसेवी प्रॉक्सी के ज़रिए कनेक्ट होता है। ब्रिज लाइनें ढूँढ़ने या चिपकाने की ज़रूरत नहीं।", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "आपके जोड़े हुए ब्रिज से कनेक्ट करें, जैसे Tor की obfs4 लाइनें।", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "Snowflake के साथ उपयोग नहीं होता। आपकी लाइनें सहेजी रहती हैं और ब्रिज लाइनें चुनने पर वापस आ जाती हैं।", "Use bridge lines": "ब्रिज लाइनें इस्तेमाल करें", "Imported lines are added to the end. Ping shows TCP response time.": "आयात की गई लाइनें अंत में जुड़ती हैं। Ping TCP प्रतिक्रिया समय दिखाता है।", "Ping bridges and sort by speed": "ब्रिज जाँचें और गति के अनुसार क्रमबद्ध करें", "Ping all": "सभी की जाँच करें", "Copy all": "सभी कॉपी करें", "Clear all": "सभी हटाएँ", "Add bridges": "ब्रिज जोड़ें", "Import from a file or your clipboard.": "फ़ाइल या क्लिपबोर्ड से आयात करें।", "Import bridges": "ब्रिज आयात करें", "From a file": "फ़ाइल से", "Choose a .txt with bridge lines": "ब्रिज लाइनों वाली .txt फ़ाइल चुनें", "Paste from clipboard": "क्लिपबोर्ड से चिपकाएँ", "Need some? Request:": "ब्रिज चाहिए? यहाँ अनुरोध करें:", "Tor bridge website": "Tor ब्रिज वेबसाइट", "Telegram bot": "Telegram बॉट",
      "Applies to the popup and this page.": "पॉपअप और इस पेज पर लागू होता है।", Theme: "थीम", Light: "हल्की", Dark: "गहरी", "Match system": "सिस्टम के अनुसार", Language: "भाषा", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome, Chrome ही रहता है", "Read the privacy policy ↗": "गोपनीयता नीति पढ़ें ↗", "Connection details": "कनेक्शन विवरण", "Bridge, transport and uptime": "ब्रिज, ट्रांसपोर्ट और अवधि", "Set up Tor Connect": "Tor Connect सेट अप करें", "ONE-TIME SETUP": "एक बार का सेटअप", "Connect Chrome through Tor": "Chrome को Tor के ज़रिए कनेक्ट करें",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "एक छोटा सहायक ऐप इस कंप्यूटर पर Tor इंस्टॉल करके Chrome से जोड़ता है। इसे केवल एक बार सेट अप करना होता है।", "Setup method": "सेटअप तरीका", "Manual installation": "मैन्युअल इंस्टॉलेशन", "Setup wizard": "सेटअप विज़ार्ड", "Install Tor Connect for this computer": "इस कंप्यूटर के लिए Tor Connect इंस्टॉल करें", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "अपने कंप्यूटर के लिए Tor Connect इंस्टॉलर डाउनलोड करके खोलें। यह Tor इंस्टॉल कर Chrome से जोड़ता है।", "Download the Mac setup app": "Mac सेटअप ऐप डाउनलोड करें", "Download the Windows installer": "Windows इंस्टॉलर डाउनलोड करें", "Download the Debian/Ubuntu package": "Debian/Ubuntu पैकेज डाउनलोड करें", "Installer not available yet": "इंस्टॉलर अभी उपलब्ध नहीं है", "Install it yourself": "खुद इंस्टॉल करें",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "Tor Project से Tor Expert Bundle डाउनलोड करें, फिर अपने कंप्यूटर के लिए दिया गया कमांड चलाएँ। यह कमांड Tor Connect की छोटी सेटअप स्क्रिप्ट डाउनलोड करके लोकल हेल्पर इंस्टॉल करता है।", "Download Tor Expert Bundle ↗": "Tor Expert Bundle डाउनलोड करें ↗", "Choose your operating system": "अपना ऑपरेटिंग सिस्टम चुनें", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "आपका ऑपरेटिंग सिस्टम नहीं पहचाना जा सका। निर्देश देखने के लिए टैब चुनें।", "Mac · Terminal": "Mac · Terminal", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Terminal", "Copy setup command": "सेटअप कमांड कॉपी करें", "View command": "कमांड देखें", "Restart Chrome after setup to load the local Tor helper.": "लोकल Tor हेल्पर लोड करने के लिए सेटअप के बाद Chrome फिर से शुरू करें।",
      "Open settings": "सेटिंग्स खोलें", "Open in a tab": "टैब में खोलें", "Setup steps": "सेटअप चरण", "Set up Tor": "Tor सेट अप करें", "Install helper": "हेल्पर इंस्टॉल करें", "Pick a bridge": "ब्रिज चुनें", Connect: "कनेक्ट करें", "CONNECTION METHOD": "कनेक्शन का तरीका", "Elapsed connection time": "कनेक्शन प्रयास का समय", "Connected duration": "कनेक्शन की अवधि", "Show error details": "त्रुटि विवरण दिखाएँ", "Saved bridges": "सहेजे गए ब्रिज", "Bridge selection": "ब्रिज चयन", Reconnect: "फिर से कनेक्ट करें", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "ब्रिज Tor के निजी प्रवेश बिंदु हैं। Tor Project से ब्रिज लें और उन्हें सेटिंग्स में जोड़ें।", "Add bridges in Settings": "सेटिंग्स में ब्रिज जोड़ें", "Auto-select bridge": "ब्रिज अपने-आप चुनें", "Tries saved bridges in order": "सहेजे गए ब्रिज क्रम से आज़माता है", "Not connected": "कनेक्ट नहीं है", "Tap the center to try saved bridges": "सहेजे गए ब्रिज आज़माने के लिए बीच में टैप करें", "Tap the center to connect": "कनेक्ट करने के लिए बीच में टैप करें", "Tap the center to disconnect": "डिस्कनेक्ट करने के लिए बीच में टैप करें", "Tap the center to cancel": "रद्द करने के लिए बीच में टैप करें", "Connecting…": "कनेक्ट हो रहा है…", "Disconnecting…": "डिस्कनेक्ट हो रहा है…", Connected: "कनेक्ट है", Disconnect: "डिस्कनेक्ट करें", "Cancel connection": "कनेक्शन रद्द करें", "Connect to Tor": "Tor से कनेक्ट करें", "Disconnect from Tor": "Tor से डिस्कनेक्ट करें", Automatic: "स्वचालित", "No bridges yet": "अभी कोई ब्रिज नहीं",
      "Tor couldn’t connect. Try again.": "Tor कनेक्ट नहीं हो सका। फिर कोशिश करें।", "Another app or Chrome profile may already have a Tor connection open.": "किसी अन्य ऐप या Chrome प्रोफ़ाइल में Tor कनेक्शन पहले से खुला हो सकता है।", "Check that Tor Connect can access its installed files.": "जाँचें कि Tor Connect अपनी इंस्टॉल की गई फ़ाइलों तक पहुँच सकता है।", "Review the bridge lines in Settings.": "सेटिंग्स में ब्रिज लाइनें जाँचें।", "Couldn’t connect. Check the error details or try again.": "कनेक्ट नहीं हो सका। त्रुटि विवरण देखें या फिर कोशिश करें।", "Asking volunteer proxies to relay your traffic.": "स्वयंसेवी प्रॉक्सी से आपका ट्रैफ़िक आगे भेजने का अनुरोध किया जा रहा है।", "Trying another volunteer proxy.": "दूसरी स्वयंसेवी प्रॉक्सी आज़माई जा रही है।", "The route was interrupted. Tor may retry automatically.": "रूट बाधित हुआ। Tor अपने-आप फिर कोशिश कर सकता है।", "Your traffic is relayed through Snowflake proxies. The route may change.": "आपका ट्रैफ़िक Snowflake प्रॉक्सी से जाता है। रूट बदल सकता है।", "Tor status unavailable": "Tor स्थिति उपलब्ध नहीं", "Connection interrupted": "कनेक्शन बाधित", "Tor setup is incomplete": "Tor सेटअप अधूरा है", "Tor status needs attention": "Tor स्थिति पर ध्यान देना ज़रूरी है", "Tor is connected": "Tor कनेक्ट है", "Connection unavailable": "कनेक्शन उपलब्ध नहीं", "Connection needs attention": "कनेक्शन पर ध्यान देना ज़रूरी है", "Could not reconnect": "फिर से कनेक्ट नहीं हो सका", "Could not stop the current connection.": "मौजूदा कनेक्शन बंद नहीं हो सका।", "Could not save settings. Try again.": "सेटिंग्स सहेजी नहीं जा सकीं। फिर कोशिश करें।", "Could not save bridge changes.": "ब्रिज बदलाव सहेजे नहीं जा सके।", "Settings saved. Reconnect now to apply them.": "सेटिंग्स सहेजी गईं। लागू करने के लिए अभी फिर से कनेक्ट करें।", "Bridge lines changed. Reconnect now to apply them.": "ब्रिज लाइनें बदली गईं। लागू करने के लिए अभी फिर से कनेक्ट करें।", Copied: "कॉपी किया गया", Clipboard: "क्लिपबोर्ड", Ping: "Ping", "Use Bridge": "ब्रिज इस्तेमाल करें", "Copy Bridge": "ब्रिज कॉपी करें"
    },
    fr: {
      "Tor Connect settings": "Paramètres de Tor Connect", "Back to Tor Connect": "Retour à Tor Connect", Settings: "Paramètres", "All changes saved": "Toutes les modifications sont enregistrées", "Save changes": "Enregistrer les modifications", "Checking connection…": "Vérification de la connexion…", "Settings saved. Reconnect to apply them.": "Paramètres enregistrés. Reconnectez-vous pour les appliquer.", "Reconnect now": "Se reconnecter maintenant", "Settings sections": "Sections des paramètres", "Connection method": "Méthode de connexion", "Bridge lines": "Lignes de bridge", Appearance: "Apparence", "Privacy and about": "Confidentialité et à propos",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "Choisissez comment Tor se connecte. Vos lignes de bridge restent dans ce profil Chrome.", "Pick how Tor reaches the network. You can switch any time.": "Choisissez comment Tor accède au réseau. Vous pouvez changer à tout moment.", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "Connexion via des proxys bénévoles. Aucune ligne de bridge à chercher ou à coller.", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "Connectez-vous via les bridges que vous ajoutez, comme les lignes obfs4 de Tor.", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "Non utilisées avec Snowflake. Vos lignes sont conservées et réapparaissent lorsque vous choisissez les lignes de bridge.", "Use bridge lines": "Utiliser les lignes de bridge", "Imported lines are added to the end. Ping shows TCP response time.": "Les lignes importées sont ajoutées à la fin. Le ping indique le temps de réponse TCP.", "Ping bridges and sort by speed": "Tester les bridges et les trier par vitesse", "Ping all": "Tout tester", "Copy all": "Tout copier", "Clear all": "Tout effacer", "Add bridges": "Ajouter des bridges", "Import from a file or your clipboard.": "Importer depuis un fichier ou le presse-papiers.", "Import bridges": "Importer des bridges", "From a file": "Depuis un fichier", "Choose a .txt with bridge lines": "Choisissez un fichier .txt contenant des lignes de bridge", "Paste from clipboard": "Coller depuis le presse-papiers", "Need some? Request:": "Besoin de bridges ? Demandez-en :", "Tor bridge website": "Site des bridges Tor", "Telegram bot": "Bot Telegram",
      "Applies to the popup and this page.": "S’applique à la fenêtre popup et à cette page.", Theme: "Thème", Light: "Clair", Dark: "Sombre", "Match system": "Suivre le système", Language: "Langue", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome reste Chrome", "Read the privacy policy ↗": "Lire la politique de confidentialité ↗", "Connection details": "Détails de connexion", "Bridge, transport and uptime": "Bridge, transport et durée", "Set up Tor Connect": "Configurer Tor Connect", "ONE-TIME SETUP": "CONFIGURATION UNIQUE", "Connect Chrome through Tor": "Connecter Chrome via Tor",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "Une petite application auxiliaire installe Tor sur cet ordinateur et le connecte à Chrome. La configuration n’est nécessaire qu’une fois.", "Setup method": "Méthode de configuration", "Manual installation": "Installation manuelle", "Setup wizard": "Assistant de configuration", "Install Tor Connect for this computer": "Installer Tor Connect sur cet ordinateur", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "Téléchargez et ouvrez le programme d’installation de Tor Connect pour votre ordinateur. Il installe Tor et le connecte à Chrome.", "Download the Mac setup app": "Télécharger l’application de configuration Mac", "Download the Windows installer": "Télécharger le programme d’installation Windows", "Download the Debian/Ubuntu package": "Télécharger le paquet Debian/Ubuntu", "Installer not available yet": "Programme d’installation bientôt disponible", "Install it yourself": "Installer soi-même",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "Téléchargez le Tor Expert Bundle depuis le Tor Project, puis exécutez la commande correspondant à votre ordinateur. Elle télécharge le script de configuration de Tor Connect et installe l’outil local.", "Download Tor Expert Bundle ↗": "Télécharger Tor Expert Bundle ↗", "Choose your operating system": "Choisissez votre système d’exploitation", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "Impossible de détecter votre système. Choisissez un onglet pour afficher les instructions.", "Mac · Terminal": "Mac · Terminal", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Terminal", "Copy setup command": "Copier la commande de configuration", "View command": "Afficher la commande", "Restart Chrome after setup to load the local Tor helper.": "Redémarrez Chrome après la configuration pour charger l’outil Tor local.",
      "Open settings": "Ouvrir les paramètres", "Open in a tab": "Ouvrir dans un onglet", "Setup steps": "Étapes de configuration", "Set up Tor": "Configurer Tor", "Install helper": "Installer l’outil", "Pick a bridge": "Choisir un bridge", Connect: "Se connecter", "CONNECTION METHOD": "MÉTHODE DE CONNEXION", "Elapsed connection time": "Durée de la tentative", "Connected duration": "Durée de connexion", "Show error details": "Afficher les détails de l’erreur", "Saved bridges": "Bridges enregistrés", "Bridge selection": "Sélection du bridge", Reconnect: "Reconnecter", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "Les bridges sont des points d’entrée privés de Tor. Demandez-en au Tor Project, puis ajoutez-les dans les paramètres.", "Add bridges in Settings": "Ajouter des bridges dans les paramètres", "Auto-select bridge": "Sélection automatique du bridge", "Tries saved bridges in order": "Essaie les bridges enregistrés dans l’ordre", "Not connected": "Non connecté", "Tap the center to try saved bridges": "Touchez le centre pour essayer les bridges enregistrés", "Tap the center to connect": "Touchez le centre pour vous connecter", "Tap the center to disconnect": "Touchez le centre pour vous déconnecter", "Tap the center to cancel": "Touchez le centre pour annuler", "Connecting…": "Connexion…", "Disconnecting…": "Déconnexion…", Connected: "Connecté", Disconnect: "Déconnecter", "Cancel connection": "Annuler la connexion", "Connect to Tor": "Se connecter à Tor", "Disconnect from Tor": "Se déconnecter de Tor", Automatic: "Automatique", "No bridges yet": "Aucun bridge pour le moment",
      "Tor couldn’t connect. Try again.": "Tor n’a pas pu se connecter. Réessayez.", "Another app or Chrome profile may already have a Tor connection open.": "Une autre application ou un autre profil Chrome utilise peut-être déjà une connexion Tor.", "Check that Tor Connect can access its installed files.": "Vérifiez que Tor Connect peut accéder aux fichiers installés.", "Review the bridge lines in Settings.": "Vérifiez les lignes de bridge dans les paramètres.", "Couldn’t connect. Check the error details or try again.": "Connexion impossible. Consultez les détails de l’erreur ou réessayez.", "Asking volunteer proxies to relay your traffic.": "Demande aux proxys bénévoles de relayer votre trafic.", "Trying another volunteer proxy.": "Essai d’un autre proxy bénévole.", "The route was interrupted. Tor may retry automatically.": "La route a été interrompue. Tor peut réessayer automatiquement.", "Your traffic is relayed through Snowflake proxies. The route may change.": "Votre trafic passe par des proxys Snowflake. La route peut changer.", "Tor status unavailable": "État de Tor indisponible", "Connection interrupted": "Connexion interrompue", "Tor setup is incomplete": "La configuration de Tor est incomplète", "Tor status needs attention": "L’état de Tor nécessite votre attention", "Tor is connected": "Tor est connecté", "Connection unavailable": "Connexion indisponible", "Connection needs attention": "La connexion nécessite votre attention", "Could not reconnect": "Reconnexion impossible", "Could not stop the current connection.": "Impossible d’arrêter la connexion actuelle.", "Could not save settings. Try again.": "Impossible d’enregistrer les paramètres. Réessayez.", "Could not save bridge changes.": "Impossible d’enregistrer les modifications des bridges.", "Settings saved. Reconnect now to apply them.": "Paramètres enregistrés. Reconnectez-vous maintenant pour les appliquer.", "Bridge lines changed. Reconnect now to apply them.": "Lignes de bridge modifiées. Reconnectez-vous pour appliquer les changements.", Copied: "Copié", Clipboard: "Presse-papiers", Ping: "Ping", "Use Bridge": "Utiliser le bridge", "Copy Bridge": "Copier le bridge"
    },
    ru: {
      "Tor Connect settings": "Настройки Tor Connect", "Back to Tor Connect": "Назад в Tor Connect", Settings: "Настройки", "All changes saved": "Все изменения сохранены", "Save changes": "Сохранить изменения", "Checking connection…": "Проверка соединения…", "Settings saved. Reconnect to apply them.": "Настройки сохранены. Переподключитесь, чтобы применить их.", "Reconnect now": "Переподключиться", "Settings sections": "Разделы настроек", "Connection method": "Способ подключения", "Bridge lines": "Строки мостов", Appearance: "Внешний вид", "Privacy and about": "Конфиденциальность и информация",
      "Choose how Tor connects. Your bridge lines stay in this Chrome profile.": "Выберите способ подключения Tor. Строки мостов хранятся в этом профиле Chrome.", "Pick how Tor reaches the network. You can switch any time.": "Выберите способ доступа Tor к сети. Его можно изменить в любое время.", Snowflake: "Snowflake", "Connects through volunteer proxies. No bridge lines to find or paste.": "Подключение через добровольческие прокси. Не нужно искать или вставлять строки мостов.", "Connect through bridges you add yourself, such as obfs4 lines from Tor.": "Подключайтесь через добавленные вами мосты, например строки obfs4 от Tor.", "Not used with Snowflake. Your lines are kept and come back when you switch to Bridge lines.": "Не используется со Snowflake. Строки сохраняются и снова появятся при выборе мостов.", "Use bridge lines": "Использовать строки мостов", "Imported lines are added to the end. Ping shows TCP response time.": "Импортированные строки добавляются в конец. Ping показывает время отклика TCP.", "Ping bridges and sort by speed": "Проверить мосты и отсортировать по скорости", "Ping all": "Проверить все", "Copy all": "Скопировать все", "Clear all": "Очистить все", "Add bridges": "Добавить мосты", "Import from a file or your clipboard.": "Импортировать из файла или буфера обмена.", "Import bridges": "Импортировать мосты", "From a file": "Из файла", "Choose a .txt with bridge lines": "Выберите .txt-файл со строками мостов", "Paste from clipboard": "Вставить из буфера обмена", "Need some? Request:": "Нужны мосты? Запросите их:", "Tor bridge website": "Сайт мостов Tor", "Telegram bot": "Бот Telegram",
      "Applies to the popup and this page.": "Применяется к всплывающему окну и этой странице.", Theme: "Тема", Light: "Светлая", Dark: "Тёмная", "Match system": "Как в системе", Language: "Язык", English: "English", Farsi: "فارسی", German: "Deutsch", Spanish: "Español", Arabic: "العربية", Chinese: "中文", Hindi: "हिन्दी", French: "Français", Russian: "Русский",
      "Chrome remains Chrome": "Chrome остаётся Chrome", "Read the privacy policy ↗": "Политика конфиденциальности ↗", "Connection details": "Сведения о подключении", "Bridge, transport and uptime": "Мост, транспорт и время работы", "Set up Tor Connect": "Настроить Tor Connect", "ONE-TIME SETUP": "ОДНОКРАТНАЯ НАСТРОЙКА", "Connect Chrome through Tor": "Подключить Chrome через Tor",
      "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.": "Небольшое вспомогательное приложение устанавливает Tor на этот компьютер и подключает его к Chrome. Настроить его нужно только один раз.", "Setup method": "Способ настройки", "Manual installation": "Ручная установка", "Setup wizard": "Мастер настройки", "Install Tor Connect for this computer": "Установить Tor Connect на этот компьютер", "Download and open the Tor Connect installer for your computer. It installs Tor and connects it to Chrome.": "Скачайте и откройте установщик Tor Connect для вашего компьютера. Он установит Tor и подключит его к Chrome.", "Download the Mac setup app": "Скачать приложение установки для Mac", "Download the Windows installer": "Скачать установщик для Windows", "Download the Debian/Ubuntu package": "Скачать пакет Debian/Ubuntu", "Installer not available yet": "Установщик пока недоступен", "Install it yourself": "Установить вручную",
      "Download the Tor Expert Bundle from the Tor Project, then run the command for your computer. The command downloads Tor Connect’s small setup script and installs the local helper.": "Скачайте Tor Expert Bundle с сайта Tor Project, затем выполните команду для своего компьютера. Она скачает небольшой установочный скрипт Tor Connect и установит локальный помощник.", "Download Tor Expert Bundle ↗": "Скачать Tor Expert Bundle ↗", "Choose your operating system": "Выберите операционную систему", macOS: "macOS", Windows: "Windows", Linux: "Linux", "We couldn’t detect your operating system. Choose a tab to see its instructions.": "Не удалось определить операционную систему. Выберите вкладку с инструкциями.", "Mac · Terminal": "Mac · Терминал", "Windows · PowerShell": "Windows · PowerShell", "Linux · Terminal": "Linux · Терминал", "Copy setup command": "Скопировать команду настройки", "View command": "Показать команду", "Restart Chrome after setup to load the local Tor helper.": "После настройки перезапустите Chrome, чтобы загрузить локальный помощник Tor.",
      "Open settings": "Открыть настройки", "Open in a tab": "Открыть во вкладке", "Setup steps": "Шаги настройки", "Set up Tor": "Настроить Tor", "Install helper": "Установить помощник", "Pick a bridge": "Выбрать мост", Connect: "Подключиться", "CONNECTION METHOD": "СПОСОБ ПОДКЛЮЧЕНИЯ", "Elapsed connection time": "Время попытки подключения", "Connected duration": "Длительность подключения", "Show error details": "Показать подробности ошибки", "Saved bridges": "Сохранённые мосты", "Bridge selection": "Выбор моста", Reconnect: "Переподключиться", "Bridges are private Tor entry points. Request some from the Tor Project, then add them in Settings.": "Мосты — частные точки входа в Tor. Запросите их у Tor Project и добавьте в настройках.", "Add bridges in Settings": "Добавить мосты в настройках", "Auto-select bridge": "Выбирать мост автоматически", "Tries saved bridges in order": "Проверяет сохранённые мосты по очереди", "Not connected": "Не подключено", "Tap the center to try saved bridges": "Нажмите в центре, чтобы проверить сохранённые мосты", "Tap the center to connect": "Нажмите в центре для подключения", "Tap the center to disconnect": "Нажмите в центре для отключения", "Tap the center to cancel": "Нажмите в центре для отмены", "Connecting…": "Подключение…", "Disconnecting…": "Отключение…", Connected: "Подключено", Disconnect: "Отключить", "Cancel connection": "Отменить подключение", "Connect to Tor": "Подключиться к Tor", "Disconnect from Tor": "Отключиться от Tor", Automatic: "Автоматически", "No bridges yet": "Мостов пока нет",
      "Tor couldn’t connect. Try again.": "Не удалось подключиться к Tor. Попробуйте ещё раз.", "Another app or Chrome profile may already have a Tor connection open.": "Возможно, в другом приложении или профиле Chrome уже открыто соединение Tor.", "Check that Tor Connect can access its installed files.": "Проверьте, что Tor Connect имеет доступ к установленным файлам.", "Review the bridge lines in Settings.": "Проверьте строки мостов в настройках.", "Couldn’t connect. Check the error details or try again.": "Не удалось подключиться. Проверьте подробности ошибки или попробуйте ещё раз.", "Asking volunteer proxies to relay your traffic.": "Запрос на передачу трафика через добровольческие прокси.", "Trying another volunteer proxy.": "Пробуем другой добровольческий прокси.", "The route was interrupted. Tor may retry automatically.": "Маршрут прерван. Tor может повторить попытку автоматически.", "Your traffic is relayed through Snowflake proxies. The route may change.": "Ваш трафик передаётся через прокси Snowflake. Маршрут может измениться.", "Tor status unavailable": "Статус Tor недоступен", "Connection interrupted": "Соединение прервано", "Tor setup is incomplete": "Настройка Tor не завершена", "Tor status needs attention": "Требуется проверить статус Tor", "Tor is connected": "Tor подключён", "Connection unavailable": "Соединение недоступно", "Connection needs attention": "Требуется проверить соединение", "Could not reconnect": "Не удалось переподключиться", "Could not stop the current connection.": "Не удалось остановить текущее соединение.", "Could not save settings. Try again.": "Не удалось сохранить настройки. Попробуйте ещё раз.", "Could not save bridge changes.": "Не удалось сохранить изменения мостов.", "Settings saved. Reconnect now to apply them.": "Настройки сохранены. Переподключитесь, чтобы применить их.", "Bridge lines changed. Reconnect now to apply them.": "Строки мостов изменены. Переподключитесь, чтобы применить изменения.", Copied: "Скопировано", Clipboard: "Буфер обмена", Ping: "Ping", "Use Bridge": "Использовать мост", "Copy Bridge": "Скопировать мост"
    }
  };

  const dynamicTranslations = {
    de: [
      [/^Bridge (\d+)$/, (_, n) => `Bridge ${n}`],
      [/^Use Bridge (\d+)$/, (_, n) => `Bridge ${n} verwenden`],
      [/^Copy Bridge (\d+)$/, (_, n) => `Bridge ${n} kopieren`],
      [/^Remove Bridge (\d+)$/, (_, n) => `Bridge ${n} entfernen`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `Probiert ${n} gespeicherte Bridges der Reihe nach`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} gespeicherte Bridges · der Reihe nach`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `Bridge ${n}, ${country}`]
    ],
    es: [
      [/^Bridge (\d+)$/, (_, n) => `Puente ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `Usar puente ${n}`],
      [/^Copy Bridge (\d+)$/, (_, n) => `Copiar puente ${n}`], [/^Remove Bridge (\d+)$/, (_, n) => `Eliminar puente ${n}`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `Prueba los ${n} puentes guardados en orden`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} puentes guardados · en orden`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `Puente ${n}, ${country}`]
    ],
    ar: [
      [/^Bridge (\d+)$/, (_, n) => `الجسر ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `استخدام الجسر ${n}`],
      [/^Copy Bridge (\d+)$/, (_, n) => `نسخ الجسر ${n}`], [/^Remove Bridge (\d+)$/, (_, n) => `إزالة الجسر ${n}`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `يجرّب ${n} من الجسور المحفوظة بالترتيب`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} جسور محفوظة · بالترتيب`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `الجسر ${n}، ${country}`]
    ],
    zh: [
      [/^Bridge (\d+)$/, (_, n) => `网桥 ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `使用网桥 ${n}`],
      [/^Copy Bridge (\d+)$/, (_, n) => `复制网桥 ${n}`], [/^Remove Bridge (\d+)$/, (_, n) => `移除网桥 ${n}`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `按顺序尝试已保存的 ${n} 个网桥`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} 个已保存网桥 · 按顺序尝试`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `网桥 ${n}，${country}`]
    ],
    hi: [
      [/^Bridge (\d+)$/, (_, n) => `ब्रिज ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `ब्रिज ${n} इस्तेमाल करें`],
      [/^Copy Bridge (\d+)$/, (_, n) => `ब्रिज ${n} कॉपी करें`], [/^Remove Bridge (\d+)$/, (_, n) => `ब्रिज ${n} हटाएँ`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `${n} सहेजे गए ब्रिज क्रम से आज़माता है`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} सहेजे गए ब्रिज · क्रम से`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `ब्रिज ${n}, ${country}`]
    ],
    fr: [
      [/^Bridge (\d+)$/, (_, n) => `Bridge ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `Utiliser le bridge ${n}`],
      [/^Copy Bridge (\d+)$/, (_, n) => `Copier le bridge ${n}`], [/^Remove Bridge (\d+)$/, (_, n) => `Supprimer le bridge ${n}`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `Essaie les ${n} bridges enregistrés dans l’ordre`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} bridges enregistrés · dans l’ordre`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `Bridge ${n}, ${country}`]
    ],
    ru: [
      [/^Bridge (\d+)$/, (_, n) => `Мост ${n}`], [/^Use Bridge (\d+)$/, (_, n) => `Использовать мост ${n}`],
      [/^Copy Bridge (\d+)$/, (_, n) => `Скопировать мост ${n}`], [/^Remove Bridge (\d+)$/, (_, n) => `Удалить мост ${n}`],
      [/^Tries (\d+) saved bridges in order$/, (_, n) => `Проверяет ${n} сохранённых мостов по очереди`],
      [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `${n} сохранённых мостов · по очереди`],
      [/^Bridge (\d+), (.+)$/, (_, n, country) => `Мост ${n}, ${country}`]
    ],
    fa: [
    [/^Bridge (\d+), currently in use$/, (_, n) => `پل ${n}، در حال استفاده`],
    [/^Bridge (\d+)$/, (_, n) => `پل ${n}`],
    [/^Use Bridge (\d+)$/, (_, n) => `استفاده از پل ${n}`],
    [/^Copy Bridge (\d+)$/, (_, n) => `کپی پل ${n}`],
    [/^Remove Bridge (\d+)$/, (_, n) => `حذف پل ${n}`],
    [/^Bridge (\d+) copied$/, (_, n) => `پل ${n} کپی شد`],
    [/^Bridge (\d+) copied\.$/, (_, n) => `پل ${n} کپی شد.`],
    [/^Bridge (\d+) excluded\. Save changes to apply it\.$/, (_, n) => `پل ${n} کنار گذاشته شد. برای اعمال، تغییرات را ذخیره کنید.`],
    [/^Bridge (\d+) included\. Save changes to apply it\.$/, (_, n) => `پل ${n} فعال شد. برای اعمال، تغییرات را ذخیره کنید.`],
    [/^Bridge (\d+) is excluded from connections$/, (_, n) => `پل ${n} در اتصال‌ها استفاده نمی‌شود`],
    [/^Bridge (\d+) saved$/, (_, n) => `پل ${n} ذخیره شد`],
    [/^Bridge (\d+) · (.+)$/, (_, n, country) => `پل ${n} · ${country}`],
    [/^Tries (\d+) saved bridges in order$/, (_, n) => `پل‌های ذخیره‌شده را به‌ترتیب امتحان می‌کند (${n})`],
    [/^(\d+) saved$/, (_, n) => `${n} ذخیره‌شده`],
    [/^(\d+) ms$/, (_, n) => `${n} میلی‌ثانیه`],
    [/^Ping: (.+)$/, (_, ping) => `پینگ: ${ping}`],
    [/^Approximate bridge country: (.+)$/, (_, country) => `کشور تقریبی پل: ${country}`],
    [/^Approximate country of Bridge (\d+): (.+)$/, (_, n, country) => `کشور تقریبی پل ${n}: ${country}`],
    [/^(\d+) saved bridge(s)? · tries in order$/, (_, n) => `امتحان پل‌های ذخیره‌شده به‌ترتیب · ${n} پل`],
    [/^ONE-TIME (MAC|WINDOWS|LINUX) SETUP$/, (_, platform) => `راه‌اندازی یک‌باره ${({ MAC: "مک", WINDOWS: "ویندوز", LINUX: "لینوکس" })[platform]}`],
    [/^Bridge (\d+), (.+), currently in use$/, (_, n, country) => `پل ${n}، ${country}، در حال استفاده`],
    [/^Bridge (\d+), (.+), currently connected$/, (_, n, country) => `پل ${n}، ${country}، اکنون متصل است`],
    [/^Bridge (\d+), (.+), selected$/, (_, n, country) => `پل ${n}، ${country}، انتخاب‌شده`],
    [/^Bridge (\d+), (.+)$/, (_, n, country) => `پل ${n}، ${country}`],
    [/^Copied\. Paste it into (Terminal|PowerShell)\.$/, (_, terminal) => `کپی شد. آن را در ${terminal} جای‌گذاری کنید.`],
    [/^(.+) has no bridge lines\.$/, (_, source) => `${source} هیچ خط پلی ندارد.`],
    [/^No new bridges\. (\d+) duplicate (?:line was|lines were) skipped\.$/, (_, n) => `پل تازه‌ای اضافه نشد. ${n} خط تکراری نادیده گرفته شد.`],
    [/^(\d+) bridge added and saved\.$/, (_, n) => `${n} پل اضافه و ذخیره شد.`],
    [/^(\d+) bridges added and saved\.$/, (_, n) => `${n} پل اضافه و ذخیره شدند.`],
    [/^(\d+) bridges? added and saved\. (\d+) duplicate (?:line was|lines were) skipped\.$/, (_, n, duplicates) => `${n} پل اضافه و ذخیره شدند؛ ${duplicates} خط تکراری نادیده گرفته شد.`],
    [/^Could not read (.+)\. Choose a plain text bridge file\.$/, (_, name) => `خواندن ${name} ممکن نشد. یک فایل متنی ساده شامل پل‌ها انتخاب کنید.`],
    [/^Connected · Bridge (\d+)$/, (_, n) => `متصل · پل ${n}`],
    [/^Reconnecting · Bridge (\d+)$/, (_, n) => `اتصال دوباره · پل ${n}`],
    [/^(Connected|Reconnecting) · Snowflake$/, (_, state) => `${state === "Connected" ? "متصل" : "در حال اتصال دوباره"} · اسنو‌فلیک`],
    [/^Tor is connected through · Bridge (\d+)\.$/, (_, n) => `Tor از طریق پل ${n} متصل است.`],
    [/^Tor is connected through · Snowflake\.$/, () => `Tor از طریق اسنو‌فلیک متصل است.`],
    [/^Remove Bridge (\d+)\? This will save the change\.$/, (_, n) => `پل ${n} حذف شود؟ این تغییر ذخیره می‌شود.`],
    [/^Crossing through Bridge (\d+)$/, (_, n) => `در حال عبور از پل ${n}`],
    [/^Tor is connected through Bridge (\d+)\.$/, (_, n) => `Tor از طریق پل ${n} متصل است.`],
    [/^Tor is connected · Snowflake\.$/, () => `Tor متصل است · اسنو‌فلیک.`]
    ]
  };

  let language = "en";
  const textState = new WeakMap();
  const attributeState = new WeakMap();

  function translate(source) {
    const catalog = translations[language];
    if (!catalog) return source;
    const exact = catalog[source];
    if (exact) return exact;
    for (const [pattern, replace] of dynamicTranslations[language] || []) {
      const match = source.match(pattern);
      if (match) return replace(...match);
    }
    return source;
  }

  function isExcluded(node) {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest("script, style, pre, code, [data-no-translate]"));
  }

  function translateTextNode(node) {
    if (isExcluded(node)) return;
    const current = node.nodeValue;
    const previous = textState.get(node);
    const source = previous && current === previous.rendered ? previous.source : current;
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    const content = source.slice(leading.length, trailing ? -trailing.length : undefined);
    const rendered = leading + translate(content) + trailing;
    textState.set(node, { source, rendered });
    if (current !== rendered) node.nodeValue = rendered;
  }

  const translatableAttributes = ["title", "aria-label", "aria-description", "placeholder", "alt"];
  function translateAttributes(element) {
    const state = attributeState.get(element) || new Map();
    for (const name of translatableAttributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      const previous = state.get(name);
      const source = previous && current === previous.rendered ? previous.source : current;
      const rendered = translate(source);
      state.set(name, { source, rendered });
      if (current !== rendered) element.setAttribute(name, rendered);
    }
    attributeState.set(element, state);
  }

  function translateSubtree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode);
    if (root.nodeType === Node.ELEMENT_NODE) {
      root.querySelectorAll("*").forEach(translateAttributes);
    }
  }

  const languageButton = document.querySelector("#languageSelect");
  const languageMenu = document.querySelector("#languageOptions");
  const languageOptions = [...document.querySelectorAll("[data-language-option]")];
  const languageCurrent = document.querySelector("#languageCurrent");
  const languageCurrentFlag = document.querySelector("#languageCurrentFlag");

  function updateLanguagePicker(open = false) {
    if (!languageButton || !languageMenu) return;
    languageButton.setAttribute("aria-expanded", String(open));
    languageButton.dataset.language = language;
    languageMenu.hidden = !open;
    let selectedOption = null;
    languageOptions.forEach((option) => {
      const selected = option.dataset.languageOption === language;
      option.setAttribute("aria-selected", String(selected));
      if (selected) selectedOption = option;
    });
    const selectedName = selectedOption?.querySelector(".language-option-name")?.textContent;
    const selectedFlag = selectedOption?.querySelector(".language-flag")?.textContent;
    if (languageCurrent && selectedName && languageCurrent.textContent !== selectedName) {
      languageCurrent.textContent = selectedName;
    }
    if (languageCurrentFlag && selectedFlag && languageCurrentFlag.textContent !== selectedFlag) {
      languageCurrentFlag.textContent = selectedFlag;
    }
  }

  function applyLanguage(nextLanguage) {
    language = Object.hasOwn(translations, nextLanguage) ? nextLanguage : "en";
    document.documentElement.lang = language;
    document.documentElement.dir = ["fa", "ar"].includes(language) ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
    translateSubtree(document.documentElement);
    updateLanguagePicker(false);
    document.dispatchEvent(new CustomEvent("tor-language-changed", { detail: { language } }));
  }

  function setLanguage(nextLanguage) {
    const selected = Object.hasOwn(translations, nextLanguage) ? nextLanguage : "en";
    applyLanguage(selected);
    chrome.storage.local.set({ [languageKey]: selected });
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateTextNode(record.target);
      else if (record.type === "attributes") translateAttributes(record.target);
      else record.addedNodes.forEach(translateSubtree);
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: translatableAttributes
  });

  languageButton?.addEventListener("click", () => {
    const open = languageButton.getAttribute("aria-expanded") !== "true";
    updateLanguagePicker(open);
  });
  languageButton?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    updateLanguagePicker(true);
    languageOptions.find((option) => option.dataset.languageOption === language)?.focus();
  });
  languageOptions.forEach((option, index) => {
    option.addEventListener("click", () => setLanguage(option.dataset.languageOption));
    option.addEventListener("keydown", (event) => {
      let targetIndex = null;
      if (event.key === "ArrowDown") targetIndex = (index + 1) % languageOptions.length;
      else if (event.key === "ArrowUp") targetIndex = (index - 1 + languageOptions.length) % languageOptions.length;
      else if (event.key === "Home") targetIndex = 0;
      else if (event.key === "End") targetIndex = languageOptions.length - 1;
      else if (event.key === "Escape") {
        event.preventDefault();
        updateLanguagePicker(false);
        languageButton?.focus();
      }
      if (targetIndex === null) return;
      event.preventDefault();
      languageOptions[targetIndex].focus();
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".language-picker")) updateLanguagePicker(false);
  });
  chrome.storage.local.get(languageKey, (stored) => applyLanguage(stored?.[languageKey]));
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[languageKey]) applyLanguage(changes[languageKey].newValue);
  });

  globalThis.torI18n = {
    get language() { return language; },
    setLanguage,
    t: translate
  };
})();
