import { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import pickBy from "lodash/pickBy";
import startCase from "lodash/startCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import Invoice from "@/components/common/Invoice";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
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
import EventFinanceReconciliationTable from "@/components/common/EventFinanceReconciliationTable";

const FinanceReconciliation = ({
  event,
  context,
  session,
  templates,
  filters,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [reportData, setReportData] = useState();
  let costItems = useState({});
  let costItemsTotal = useState(0);
  let paymentItems = useState({});
  let paymentItemsTotal = useState(0);
  const [isGrid, setIsGrid] = useState(true);

  const tableColumns = [
    { key: "name", label: "Item", _style: { width: "70%" } },
    { key: "quantity", label: "Count", _style: { width: "10%" } },
    { key: "gst", label: "VAT/GST", _style: { width: "10%" } },
    { key: "cost", label: "Cost", _style: { width: "10%" } },
  ];

  if (reportData) {
    costItems = pickBy(reportData, (items, sectionIndex) => {
      return [
        "active_registrations",
        "cancelled_registrations",
        "addons",
        "accommodations",
      ].includes(sectionIndex);
    });
  }

  if (reportData) {
    paymentItems = pickBy(reportData, (items, sectionIndex) => {
      return ["surcharges", "charges", "transfers", "user_payments"].includes(
        sectionIndex
      );
    });
  }

  costItemsTotal = Object.values(costItems).reduce((total, section) => {
    const sectionTotal = Object.values(section).reduce(
      (secTotal, sectionRow) => secTotal + parseInt(sectionRow?.cost),
      0
    );
    return total + sectionTotal;
  }, 0);

  paymentItemsTotal = Object.values(paymentItems).reduce((total, section) => {
    const sectionTotal = Object.values(section).reduce(
      (secTotal, sectionRow) => secTotal + parseInt(sectionRow?.cost),
      0
    );
    return total + sectionTotal;
  }, 0);

  const SectionTable = ({ section, items }) => {
    return (
      <div className="mb-4">
        <h5 className="text-success mb-3">{startCase(section)}</h5>
        <Table
          items={items}
          columns={tableColumns}
          initialNumOfEntries={items.length}
          invoice
          bordered
          hideNumOfEntriesSelect
          hideSearch
          hideColumnSelector
          hideNumOfEntries
          hidePagination
        />
      </div>
    );
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

  useEffect(() => {
    const fetchReconciliationReportData = async () => {
      try {
        const response = await api({
          url: `events/${event?.id}/finance/reports/reconciliation`,
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });
        setReportData(response.data.data);
      } catch (e) {}
    };
    fetchReconciliationReportData();
  }, []);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Reconciliation" />
      <FinanceTabs />
      <ReconciliationTab />
      <FilterLayout filters={filters} templates={templates}>
        {() => {
          return (
            <Panel
              title="Reconciliation"
              color="inverse"
              maximizable
              collapsable
            >
              {reportData && (
                <Invoice className="p-0">
                  <Invoice.Content>
                    <div className="mb-4">
                      {Object.entries(costItems).map(([section, items]) => {
                        if (items.length) {
                          return <SectionTable {...{ section, items }} />;
                        }
                      })}
                      <Invoice.Total
                        total={new Intl.NumberFormat(router.locale, {
                          style: "currency",
                          currency: event?.currency,
                        }).format(costItemsTotal)}
                        totalLabel="Total Amount Reconciled"
                      />
                    </div>
                    <div className="mb-4">
                      {Object.entries(paymentItems).map(([section, items]) => {
                        if (items.length) {
                          return <SectionTable {...{ section, items }} />;
                        }
                      })}
                      <Invoice.Total
                        total={new Intl.NumberFormat(router.locale, {
                          style: "currency",
                          currency: event?.currency,
                        }).format(costItemsTotal - paymentItemsTotal)}
                        totalLabel="Total Amount Outstanding"
                      />
                    </div>
                  </Invoice.Content>
                </Invoice>
              )}
            </Panel>
          );
        }}
      </FilterLayout>
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

    const financeFiltersResponse = await api({
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
        filters: financeFiltersResponse.data,
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

FinanceReconciliation.authorized = true;
FinanceReconciliation.allowedRoles = [ADMIN];
FinanceReconciliation.Layout = ViewEventLayout;
FinanceReconciliation.defaultProps = {
  registrations: [],
};

export default FinanceReconciliation;
