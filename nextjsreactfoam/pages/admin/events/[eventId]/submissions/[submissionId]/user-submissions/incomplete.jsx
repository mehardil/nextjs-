import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import UserSubmissionsTable from "@/components/common/UserSubmissionsTable";
import UserSubmissionsHeader from "@/components/common/UserSubmissionsHeader";
import FilterLayout from "@/components/layouts/FilterLayout";
import ViewEventSubmissionLayout from "@/components/layouts/ViewEventSubmissionLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const IncompleteSubmissionUserSubmissions = ({
  event,
  submission,
  filters,
  userSubmissions,
  meta,
}) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

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

  /**
   * Sets the submission to be used for the entire submission-related pages.
   * This must be implemented in every submission page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_SUBMISSION,
      payload: submission,
    });
  }, [submission]);

  return (
    <>
      <UserSubmissionsHeader />
      <FilterLayout filters={filters} templates={[]} item={event?.id}>
        {() => (
          <Panel
            title={t("common.search")}
            color="inverse"
            maximizable
            collapsable
          >
            <UserSubmissionsTable
              items={userSubmissions}
              initialPage={meta.current_page}
              numOfPages={meta.last_page}
              totalItems={meta.total}
              from={meta.from}
              to={meta.to}
            />
          </Panel>
        )}
      </FilterLayout>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const submissionResponse = await api({
        url: `/events/${context.params.eventId}/submissions/${context.params.submissionId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      const filtersResponse = await api({
        url: `/events/${context.params.eventId}/user-submissions/filters/search`,
        headers,
      });

      const userSubmissionsResponse = await api({
        url: `/events/${context.params.eventId}/submissions/${context.params.submissionId}/user-submissions?complete=1&withUserData=1&withCategoryData=1&withPresentationTypeData=1&withSessionData=1&${urlQueryString}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          submission: submissionResponse.data.data,
          event: eventResponse.data.data,
          filters: filtersResponse.data,
          userSubmissions: userSubmissionsResponse.data.data,
          meta: userSubmissionsResponse.data.meta,
        },
      };
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

IncompleteSubmissionUserSubmissions.Layout = ViewEventSubmissionLayout;

export default IncompleteSubmissionUserSubmissions;
