import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./guards/RequireAuth";
import RequireRole from "./guards/RequireRole";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";
import StudentLayout from "./layouts/StudentLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";
import ApplicantsPage from "./pages/admin/ApplicantsPage";
import ApplicationReviewPage from "./pages/admin/ApplicationReviewPage";
import ReviewQueuePage from "./pages/admin/ReviewQueuePage";
import ScholarshipEditorPage from "./pages/admin/ScholarshipEditorPage";
import ScholarshipsAdminPage from "./pages/admin/ScholarshipsAdminPage";
import SiteContentPage from "./pages/admin/SiteContentPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/public/AboutPage";
import HomePage from "./pages/public/HomePage";
import ProgramPolicyPage from "./pages/public/ProgramPolicyPage";
import ScholarshipDetailsPage from "./pages/public/ScholarshipDetailsPage";
import ScholarshipsPage from "./pages/public/ScholarshipsPage";
import ApplicationDetailsPage from "./pages/student/ApplicationDetailsPage";
import ApplyScholarshipPage from "./pages/student/ApplyScholarshipPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import ProfilePage from "./pages/student/ProfilePage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentScholarshipsPage from "./pages/student/StudentScholarshipsPage";
export default function App() {
    return <BrowserRouter><AuthProvider><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />}/>
      <Route path="/scholarships" element={<ScholarshipsPage />}/>
      <Route path="/scholarships/:id" element={<ScholarshipDetailsPage />}/>
      <Route path="/program-policy" element={<ProgramPolicyPage />}/>
      <Route path="/about" element={<AboutPage />}/>
    </Route>
    <Route path="/login" element={<LoginPage />}/>
    <Route path="/register" element={<RegisterPage />}/>
    <Route path="/student" element={<RequireAuth><RequireRole role="student"><StudentLayout /></RequireRole></RequireAuth>}>
      <Route index element={<StudentDashboardPage />}/>
      <Route path="scholarships" element={<StudentScholarshipsPage />}/>
      <Route path="apply/:id" element={<ApplyScholarshipPage />}/>
      <Route path="applications" element={<MyApplicationsPage />}/>
      <Route path="applications/:id" element={<ApplicationDetailsPage />}/>
      <Route path="notifications" element={<NotificationsPage />}/>
      <Route path="profile" element={<ProfilePage />}/>
    </Route>
    <Route path="/admin" element={<RequireAuth><RequireRole role="admin"><AdminLayout /></RequireRole></RequireAuth>}>
      <Route index element={<AdminDashboardPage />}/>
      <Route path="scholarships" element={<ScholarshipsAdminPage />}/>
      <Route path="scholarships/new" element={<ScholarshipEditorPage />}/>
      <Route path="scholarships/:id/edit" element={<ScholarshipEditorPage />}/>
      <Route path="applicants" element={<ApplicantsPage />}/>
      <Route path="reviews" element={<ReviewQueuePage />}/>
      <Route path="review/:scholarshipId/:uid" element={<ApplicationReviewPage />}/>
      <Route path="site-content" element={<SiteContentPage />}/>
    </Route>
    <Route path="*" element={<NotFoundPage />}/>
  </Routes></AuthProvider></BrowserRouter>;
}

