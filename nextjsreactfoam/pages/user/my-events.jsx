import Link from "next/link";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import capitalize from "lodash/capitalize";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
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

const UserMyEvents = ({ registrations }) => {
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
    { key: "event", label: "Event" },
    { key: "item", label: "Registration Item" },
    { key: "outstanding", label: "Outstanding" },
    { key: "action", label: "Action" },
  ];

  const scopedSlots = {
    event: ({ event }) => <>{`${event?.long_name} (${event?.short_name})`}</>,
    item: ({ item }) => <>{item?.name}</>,
    action: ({ event }) => (
      <Link
        href={{
          pathname: paths.DELEGATE_DASHBOARD,
          query: { eventId: event?.id },
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
      <PageHeader title="Your Events" />
      <Panel title="Your Registrations" color="inverse" maximizable collapsable>
        <Table
          items={registrations}
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
      const registrationsResponse = await api({
        url: `/registrations?user=${session?.user?.id}&withEventData=1`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          registrations: registrationsResponse.data.data,
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

UserMyEvents.authorized = true;
UserMyEvents.Layout = DashboardLayout;

export default UserMyEvents;
