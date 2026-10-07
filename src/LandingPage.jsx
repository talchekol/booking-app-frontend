import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  CalendarClock,
  Link2,
  MessageSquareText,
  Repeat,
  BarChart3,
  Smartphone,
  Check,
  ArrowLeft,
} from "lucide-react";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "./config/branding";
import "./LandingPage.css";

// עסק לדוגמה שמוצג כדמו חי בדף הנחיתה
const DEMO_SLUG = "tal-barber";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "יומן תורים חכם",
    desc: "ניהול תורים, חסימת ימים ושעות, וקביעת תורים ידנית - הכל במקום אחד.",
  },
  {
    icon: Link2,
    title: "כתובת ייחודית לעסק שלך",
    desc: "כל עסק מקבל קישור אישי משלו לשיתוף עם הלקוחות, בלי צורך באתר נפרד.",
  },
  {
    icon: Smartphone,
    title: "כניסת לקוחות ב-SMS",
    desc: "הלקוחות שלך נכנסים עם קוד לנייד בלבד - בלי סיסמאות, בלי הרשמה מסורבלת.",
  },
  {
    icon: Repeat,
    title: "שוק החלפות תורים",
    desc: "לקוחות יכולים להציע ולהחליף תורים ביניהם, בלי מעורבות שלך.",
  },
  {
    icon: MessageSquareText,
    title: "הודעות שידור",
    desc: "עדכון מהיר לכל הלקוחות - שעות מיוחדות, מבצעים ועוד.",
  },
  {
    icon: BarChart3,
    title: "דוחות וסטטיסטיקות",
    desc: "מעקב אחרי תורים, הכנסות משוערות ולקוחות פעילים בזמן אמת.",
  },
];

const CLIENT_SHOTS = [
  { src: "/landing/client-home.png", caption: "מסך הבית של הלקוח" },
  { src: "/landing/client-select-barber.png", caption: "בחירת איש צוות" },
];

const ADMIN_SHOTS = [
  { src: "/landing/admin-calendar.png", caption: "יומן ניהול התורים" },
  { src: "/landing/admin-broadcast.png", caption: "הודעות ושוק החלפות" },
];

const STEPS = [
  { n: "1", title: "נרשמים", desc: "כמה פרטים ובוחרים כתובת ייחודית לעסק שלכם" },
  { n: "2", title: "מגדירים", desc: "שירותים, אנשי צוות ושעות פעילות" },
  { n: "3", title: "מתחילים לקבל תורים", desc: "שולחים את הקישור ללקוחות והם קובעים לבד" },
];

const PLANS = [
  {
    name: "חינמי",
    price: "₪0",
    period: "/ לחודש",
    badge: null,
    features: ["עסק אחד", "יומן תורים מלא", "עד 2 אנשי צוות", "כתובת אישית לעסק"],
  },
  {
    name: "מקצועי",
    price: "בקרוב",
    period: "",
    badge: "בקרוב",
    highlighted: true,
    features: ["כל מה שבתוכנית החינמית", "אנשי צוות ללא הגבלה", "דוחות מתקדמים", "תמיכה מועדפת"],
  },
  {
    name: "עסקי",
    price: "בקרוב",
    period: "",
    badge: "בקרוב",
    features: ["כל מה שבתוכנית המקצועית", "מספר סניפים", "מיתוג מלא", "אינטגרציות מתקדמות"],
  },
];

export default function LandingPage() {
  return (
    <div className="landing-root" dir="rtl">
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <div className="landing-nav__logo">
            <Store size={20} />
          </div>
          <span>{PLATFORM_NAME}</span>
        </div>
        <nav className="landing-nav__links">
          <a href="#features">תכונות</a>
          <a href="#pricing">מחירים</a>
          <Link to="/admin">כניסת מנהלים</Link>
        </nav>
        <Link to="/register" className="landing-nav__cta">
          הרשמת עסק
        </Link>
      </header>

      <section className="landing-hero">
        <h1>{PLATFORM_TAGLINE}</h1>
        <p>
          המערכת שמאפשרת לכל עסק תורים - מספרה, קליניקה או מכון - לקבל קישור
          משלו ולנהל תורים, צוות ולקוחות בלי כאב ראש.
        </p>
        <div className="landing-hero__actions">
          <Link to="/register" className="btn-primary-lg">
            הרשמת עסק בחינם
            <ArrowLeft size={18} />
          </Link>
          <Link to={`/${DEMO_SLUG}`} className="btn-secondary-lg" target="_blank">
            צפייה בדוגמה חיה
          </Link>
        </div>
      </section>

      <section className="landing-gallery">
        <h2>ככה זה נראה בפועל</h2>
        <p className="landing-gallery__sub">
          צילומים אמיתיים מתוך המערכת - גם מה שהלקוחות שלכם רואים, וגם מה שאתם רואים כבעלי העסק.
        </p>
        <div className="landing-gallery__groups">
          <div className="gallery-group">
            <h3>צד הלקוח</h3>
            <div className="gallery-group__row">
              {CLIENT_SHOTS.map((shot) => (
                <figure key={shot.src} className="gallery-shot gallery-shot--phone">
                  <img src={shot.src} alt={shot.caption} loading="lazy" />
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="gallery-group">
            <h3>צד הניהול</h3>
            <div className="gallery-group__row">
              {ADMIN_SHOTS.map((shot) => (
                <figure key={shot.src} className="gallery-shot gallery-shot--wide">
                  <img src={shot.src} alt={shot.caption} loading="lazy" />
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features">
        <h2>הכל מה שהעסק שלך צריך</h2>
        <div className="landing-features__grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-steps">
        <h2>איך זה עובד</h2>
        <div className="landing-steps__row">
          {STEPS.map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-card__number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="landing-pricing">
        <h2>תוכניות מחיר</h2>
        <p className="landing-pricing__sub">
          כרגע כל התכונות פתוחות לכולם בחינם - תוכניות בתשלום יתווספו בהמשך.
        </p>
        <div className="landing-pricing__grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`plan-card ${plan.highlighted ? "highlighted" : ""}`}
            >
              {plan.badge && <span className="plan-card__badge">{plan.badge}</span>}
              <h3>{plan.name}</h3>
              <div className="plan-card__price">
                <span className="plan-card__price-amount">{plan.price}</span>
                <span className="plan-card__price-period">{plan.period}</span>
              </div>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={15} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-secondary-lg plan-card__cta">
                התחלה
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>
          {PLATFORM_NAME} · {PLATFORM_TAGLINE}
        </span>
        <div className="landing-footer__links">
          <Link to="/register">הרשמת עסק</Link>
          <Link to="/admin">כניסת מנהלים</Link>
        </div>
      </footer>
    </div>
  );
}
