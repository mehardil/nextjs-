import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Alert from "@/components/ui/Alert";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Widget from "@/components/ui/Widget";
import Icon from "@/components/ui/Icon";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";

const UserGroups = () => {
  const t = useTranslations();

  return (
    <ContentErrorBoundary>
      <PageHeader title="User Groups" />
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  return {
    props: {},
  };
};

UserGroups.authorized = true;
// UserGroups.allowedRoles = [];
UserGroups.Layout = DashboardLayout;

export default UserGroups;
