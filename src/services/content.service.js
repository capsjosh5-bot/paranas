import { get, ref, set } from "firebase/database";
import { db } from "../config/firebase";
export const DEFAULT_SITE_CONTENT = {
    heroTitle: "Building brighter futures for Paranas students",
    heroText: "A transparent and accessible online portal for LGU scholarship opportunities, applications, evaluation, and student updates.",
    aboutTitle: "About the Municipality of Paranas",
    aboutText: "Paranas is a first-class municipality in the Province of Samar, Eastern Visayas. The municipality has 44 barangays and recorded a population of 35,281 in the 2024 POPCEN of the Philippine Statistics Authority.",
    historyText: "The municipality was formerly known as Wright. Republic Act No. 6681, approved on November 4, 1988, changed its name to the Municipality of Paranas.",
    policyIntro: "The LGU Scholarship Program supports qualified residents of Paranas and promotes academic responsibility, family participation, and community involvement. Scholarship-specific rules published by the administrator govern each application period.",
    updatedAt: 0,
};
export async function getSiteContent() {
    const snapshot = await get(ref(db, "siteContent"));
    return snapshot.exists() ? { ...DEFAULT_SITE_CONTENT, ...snapshot.val() } : DEFAULT_SITE_CONTENT;
}
export async function saveSiteContent(content, adminUid) {
    const payload = {
        ...DEFAULT_SITE_CONTENT,
        ...content,
        updatedAt: Date.now(),
        updatedBy: adminUid,
    };
    await set(ref(db, "siteContent"), payload);
    return payload;
}

