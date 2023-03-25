import Link from "next/link";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import capitalize from "lodash/capitalize";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Pill from "@/components/ui/Pill";
import Table from "@/components/ui/Table";
import Widget from "@/components/ui/Widget";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const UserDashboard = ({ memberships }) => {
  const t = useTranslations();

  const colorCode = {
    active: "info",
    cancelled: "grey",
    pending: "secondary",
    expired: "danger",
    expiring: "warning",
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "organisation", label: "Society Name" },
    { key: "membership_type", label: "Membership Package" },
    { key: "expiry_date", label: "Expiry Date" },
    { key: "outstanding", label: "Amount Outstanding" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ];

  const scopedSlots = {
    organisation: ({ organisation }) => (
      <>{`${organisation?.long_name} (${organisation?.short_name})`}</>
    ),
    membership_type: ({ membership_type }) => <>{membership_type?.name}</>,
    status: ({ status }) => (
      <Pill color={colorCode[status]}>{capitalize(status)}</Pill>
    ),
    action: ({ organisation }) => (
      <Link
        href={{
          pathname: paths.MEMBER_DASHBOARD,
          query: { organisationId: organisation?.id },
        }}
        passHref
      >
        <Button tag="a" color="white" size="xs">
          {t("common.manage")}
        </Button>
      </Link>
    ),
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Your Societies" />
      <Panel title="Your Memberships" color="inverse" maximizable collapsable>
        <Table
          items={memberships}
          columns={columns}
          scopedSlots={scopedSlots}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const membershipsResponse = await api({
        url: `/memberships?user=${session?.user?.id}&withOrganisationData=1`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          memberships: membershipsResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {},
  };
};

UserDashboard.authorized = true;
UserDashboard.Layout = DashboardLayout;

export default UserDashboard;
