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

import FilterLayout from "@/components/layouts/FilterLayout";
import FinanceTabs from "@/components/forPage/EventFinance/components/Tabs";
import EventFinanceSearchTable from "@/components/common/EventFinanceSearchTable";

const FinanceSearch = ({
  event,
  registrations,
  context,
  session,
  meta,
  templates,
  filters,
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
      <PageHeader title="Finance" />
      <FinanceTabs />
      <FilterLayout
        filters={filters}
        templates={templates}
        Types={FilterLayout.ItemTypes.EVENT}
        item={1}
      >
        {() => {
          return (
            <>
              {isGrid && (
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title="Search"
                >
                  <EventFinanceSearchTable items={registrations} />
                </Panel>
              )}
            </>
          );
        }}
      </FilterLayout>
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
    const eventResponse = await api({
      url: `/events/${context.params.eventId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const registrationResponse = await api({
      url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const registrationFiltersResponse = await api({
      url: `/events/${context.query.eventId}/finance/filters/search`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const templatesResponse = await api({
      url: `/filter-templates`,
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
        registrations: registrationResponse.data.data,
        meta: registrationResponse.data.meta,
        filters: registrationFiltersResponse.data,
        templates: templatesResponse.data.data,
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

FinanceSearch.authorized = true;
FinanceSearch.allowedRoles = [ADMIN];
FinanceSearch.Layout = ViewEventLayout;
FinanceSearch.defaultProps = {
  registrations: [],
};

export default FinanceSearch;
