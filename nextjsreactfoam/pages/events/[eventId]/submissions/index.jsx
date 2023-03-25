import { useState, forwardRef, useEffect } from "react";

import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import UserSubmissionsTable from "@/components/common/UserSubmissionsTable";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";

const EventsSubmissions = ({ submissions, event, context, session, meta }) => {
  const t = useTranslations();

  const globalDispatch = useGlobalDispatch();

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Submissions" />
      <div className="row">
        <div className="col-md-12">
          <Panel
            title="Your Submissions"
            color="inverse"
            maximizable
            collapsable
          >
            <UserSubmissionsTable
              event={event}
              items={submissions}
              initialPage={meta.current_page}
              numOfPages={meta.last_page}
              totalItems={meta.total}
              from={meta.from}
              to={meta.to}
              withBatchActions={false}
              withSessionData={false}
            />
          </Panel>
        </div>
      </div>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    const eventResponse = await api({
      url: `/events/${context.params.eventId}`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    /**
     * nextApi is a utility to make a request to the
     * nextJS API (not Currinda API). It is an instance with the
     * App URL as its baseURL.
     */
    const userSubmissionsResponse = await api({
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
      url: interpolatePath(apiPaths.EVT_USERSUBMISSIONS, {
        eventId: context.params.eventId,
        query: {
          ...context.query,
          include: "submission",
          page: context.query.page || 1,
          forUser: session.user.id,
        },
      }),
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
        submissions: userSubmissionsResponse.data.data,
        event: eventResponse.data.data,
        meta: userSubmissionsResponse.data.meta,
      },
    };
  }
};

EventsSubmissions.authorized = true;
EventsSubmissions.Layout = DashboardLayout;
EventsSubmissions.defaultProps = {
  submission: [],
};
export default EventsSubmissions;
