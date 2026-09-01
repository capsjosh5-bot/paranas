import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export default function NotFoundPage() {
    return <div className="not-found-page"><div><span>404</span><h1>Page not found</h1><p>The page you requested does not exist or may have been moved.</p><Link className="button button-primary" to="/"><ArrowLeft size={17}/> Return to homepage</Link></div></div>;
}

