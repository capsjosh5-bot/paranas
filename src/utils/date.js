export function formatDate(value, options = {}) {
    if (!value)
        return "—";
    const date = typeof value === "number" ? new Date(value) : new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return "—";
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
    }).format(date);
}
export function formatDateTime(value) {
    if (!value)
        return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "—";
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}
export function isApplicationOpen(scholarship) {
    const now = Date.now();
    const start = scholarship?.openDate ? new Date(scholarship.openDate).getTime() : null;
    const end = scholarship?.closeDate ? new Date(`${scholarship.closeDate}T23:59:59`).getTime() : null;
    return scholarship?.status === "published" && (!start || start <= now) && (!end || end >= now);
}

