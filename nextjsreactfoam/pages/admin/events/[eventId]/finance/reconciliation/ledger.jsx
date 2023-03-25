import { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import FinanceLedgerTable from "@/components/common/FinanceLedgerTable";
import FinanceTabs from "@/components/forPage/EventFinance/components/Tabs";
import ReconciliationTab from "@/components/forPage/EventFinance/components/ReconciliationTab";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import FilterLayout from "@/components/layouts/FilterLayout";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const LedgersReport = ({
  event,
  ledgers,
  context,
  session,
  meta,
  templates,
  filters,
}) => {
  const router = useRouter();
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

  return (
    <ContentErrorBoundary>
      <PageHeader title="Ledgers" />
      <FinanceTabs />
      <ReconciliationTab />
      <FilterLayout filters={filters} templates={templates}>
        {() => {
          return (
            <Panel title="Ledgers" color="inverse" maximizable collapsable>
              <FinanceLedgerTable
                items={ledgers}
                initialPage={meta.current_page}
                numOfPages={meta.last_page}
                totalItems={meta.total}
                from={meta.from}
                to={meta.to}
                initialKeyword={context.query.keyword}
              />
            </Panel>
          );
        }}
      </FilterLayout>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
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

    const ledgers = await api({
      url: `/events/${context.params.eventId}/finance/reports/reconciliation/ledgers?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const ledgersFilterResponse = await api({
      url: `/events/${context.query.eventId}/finance/filters/reconciliation`,
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
        ledgers: ledgers.data.data,
        meta: ledgers.data.meta,
        filters: ledgersFilterResponse.data,
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

LedgersReport.authorized = true;
LedgersReport.allowedRoles = [ADMIN];
LedgersReport.Layout = ViewEventLayout;
LedgersReport.defaultProps = {
  registrations: [],
};

export default LedgersReport;
