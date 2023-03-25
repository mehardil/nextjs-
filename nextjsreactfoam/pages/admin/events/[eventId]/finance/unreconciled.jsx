import { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import localizeDate from "@/utils/localizeDate";
import FilterLayout from "@/components/layouts/FilterLayout";
import FinanceTabs from "@/components/forPage/EventFinance/components/Tabs";
import ReconciliationTab from "@/components/forPage/EventFinance/components/ReconciliationTab";
import FinanceUnreconciledTable from "@/components/common/FinanceUnreconciledTable";

const FinanceUnreconciled = ({
  event,
  registrations,
  context,
  session,
  meta,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [isGrid, setIsGrid] = useState(true);

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
      <PageHeader title="Unreconciled" />
      <FinanceTabs />
      <Panel title="Unreconciled" color="inverse" maximizable>
        <FinanceUnreconciledTable
          items={registrations}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          totalItems={meta.total}
          from={meta.from}
          to={meta.to}
          initialKeyword={context.query.keyword}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
    isOwing: 1,
  });

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
    const eventResponse = await api({
      url: `/events/${context.params.eventId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const registrationsResponse = await api({
      url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
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
        event: eventResponse.data.data,
        registrations: registrationsResponse.data.data,
        meta: registrationsResponse.data.meta,
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

FinanceUnreconciled.authorized = true;
FinanceUnreconciled.allowedRoles = [ADMIN];
FinanceUnreconciled.Layout = ViewEventLayout;
FinanceUnreconciled.defaultProps = {
  registrations: [],
};

export default FinanceUnreconciled;
