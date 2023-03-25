import { useSession } from "next-auth/client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ADMIN } from "@/constants/roles";

const AdminDashboard = () => {
  return <div />;
};

export const getServerSideProps = () => {
  return {
    props: {},
  };
};

AdminDashboard.authorized = true;
AdminDashboard.allowedRoles = [ADMIN];
AdminDashboard.Layout = DashboardLayout;

export default AdminDashboard;
