import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import Table from "@/components/ui/Table";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const Delegates = ({ event, sponsors, meta, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "item_name", label: "Item Name" },
    { key: "registration", label: "Registration" },
    { key: "submissions", label: "Submissions" },
    { key: "date_added", label: "Date Added" },
    { key: "date_modified", label: "Date Modified" },
  ];

  const scopedSlots = {
    first_name: ({ id, user }) => {
      return (
        <Link
          href={{
            pathname: paths.ADMIN_EVT_SPONSOR_DASHBOARD,
            query: { spponsorId: id },
          }}
        >
          <a>{user.first_name}</a>
        </Link>
      );
    },
    last_name: (item) => (
      <>
        <Link href={`sponsors/${item?.id}`}>{item.user.last_name}</Link>
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
  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="All Sponsors" />
      <Panel title="Event Sponsors" color="inverse" maximizable collapsable>
        <Table
          items={sponsors}
          columns={columns}
          scopedSlots={scopedSlots}
        //   onPageChange={handlePageChange}
        //   initialPage={meta.current_page}
        //   numOfPages={meta.last_page}
        //   initialKeyword={context.query.keyword}
        //   onKeywordChange={handleKeywordChange}
          batchActions={[]}
          bordered
        //   {...{ initialNumOfEntries }}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });
    //   const sponsorResponse = await api({
    //     url: `/events/${context.params.eventId}/sponsors?${urlQueryString}`,
    //     headers,
    //   });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          sponsors: [],
          //meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

Delegates.Layout = ViewEventLayout;

export default Delegates;
