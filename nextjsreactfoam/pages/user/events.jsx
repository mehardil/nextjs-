import { useState, forwardRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EventDuplicateModal from "@/components/modals/EventDuplicateModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import nextApi from "@/utils/nextApi";
import getTenant from "@/utils/getTenant";

const UserAllEvents = ({ events, context, session, meta }) => {
  const router = useRouter();
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentEvents, setCurrentEvents] = useState(events);
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "short_name", label: "Short Name" },
    { key: "long_name", label: "Long Name" },
    { key: "type", label: "Type" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "registration_open", label: "Registration Open" },
    { key: "registration_end", label: "Registration End" },
    { key: "action", label: "Action", _style: { width: "3%" } },
  ];

  const scopedSlots = {
    short_name: ({ id, short_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_EVT_DASHBOARD, query: { eventId: id } }}
        >
          <a>{short_name}</a>
        </Link>
      );
    },
    long_name: ({ id, long_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_EVT_DASHBOARD, query: { eventId: id } }}
        >
          <a>{long_name}</a>
        </Link>
      );
    },
    action: (item) => (
      <>
        <Button.Dropdown size="xs" color="white" options={[]}>
          <Link
            href={{
              pathname: paths.DELEGATE_REGISTER,
              query: { eventId: item.id },
            }}
            passHref
          >
            <Button tag="a" size="xs" color="white">
              Register
            </Button>
          </Link>
        </Button.Dropdown>
      </>
    ),
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="All Events" />
      <Panel title="Events" color="inverse" maximizable collapsable>
        <Table
          items={currentEvents}
          columns={columns}
          scopedSlots={scopedSlots}
          onPageChange={handlePageChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    /**
     * nextApi is a utility to make a request to the
     * nextJS API (not Currinda API). It is an instance with the
     * App URL as its baseURL.
     */
    const response = await api({
      url: `/events?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        events: response.data.data,
        meta: response.data.meta,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {},
  };
};

UserAllEvents.authorized = true;
UserAllEvents.Layout = DashboardLayout;
UserAllEvents.defaultProps = {
  events: [],
};

export default UserAllEvents;
