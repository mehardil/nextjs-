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
import localizeDate from "@/utils/localizeDate";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import FinanceTabs from "@/components/forPage/EventFinance/components/Tabs";
import FinanceSubTabs from "@/components/forPage/EventFinance/components/FinanceSubTabs";
import EventFinanceProcessDDTable from "@/components/common/EventFinanceProcessDDTable";

const FinanceProcessedCash = ({ event, transactions }) => {
  const eventDispatch = useEventDispatch();
  const [selectedTransactions, setSelectedTransactions] = useState([]);

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
      <FinanceSubTabs />

      <Panel
        maximizable
        className="mt-4"
        color="inverse"
        title="Process Manual CC"
      >
        <div className="row justify-content-between my-4">
          <div className="col-md-6">
            <h4>Cash</h4>
            <h3>AHHDS</h3>
            <p>Generated on {localizeDate(new Date())}</p>
          </div>
          <div className="col-md-6">
            <div className="float-right">
              <Button className="mr-2">Print</Button>
              <Button color="primary">
                <Icon icon="file-o" className="mr-1" />
                Approve
              </Button>
            </div>
          </div>
        </div>

        <EventFinanceProcessDDTable
          items={transactions}
          selectedItems={setSelectedTransactions}
        />
      </Panel>
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

    const tableResponse = await api({
      url: `/events/${context.params.eventId}/finance/reports/transactions?type=ManualCC`,
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
        transactions: tableResponse.data.data,
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

FinanceProcessedCash.authorized = true;
FinanceProcessedCash.allowedRoles = [ADMIN];
FinanceProcessedCash.Layout = ViewEventLayout;
FinanceProcessedCash.defaultProps = {
  transactions: [],
};

export default FinanceProcessedCash;
