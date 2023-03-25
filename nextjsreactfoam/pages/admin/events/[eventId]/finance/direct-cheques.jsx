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
import FinanceTabs from "@/components/forPage/EventFinance/components/Tabs";
import EventFinanceProcessDDTable from "@/components/common/EventFinanceProcessDDTable";

const FinanceDirectCheques = ({ event, transactions }) => {
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
      <div className="row">
        <div className="col-md-2 mt-4">
          {selectedTransactions.length == 1 && (
            <>
              <h5>Account Number</h5>
              <p className="panel-title">
                {
                  transactions[
                    transactions
                      .map((item) => item.id)
                      .indexOf(selectedTransactions[0])
                  ].transaction_event.bank_account_details.account_number
                }
              </p>
              <h5>Account Name</h5>
              <p className="panel-title">
                {
                  transactions[
                    transactions
                      .map((item) => item.id)
                      .indexOf(selectedTransactions[0])
                  ].transaction_event.bank_account_details.name
                }
              </p>
              <h5>BSB Number</h5>
              <p className="panel-title">
                {
                  transactions[
                    transactions
                      .map((item) => item.id)
                      .indexOf(selectedTransactions[0])
                  ].transaction_event.bank_account_details.bsb
                }
              </p>
              {transactions[
                transactions
                  .map((item) => item.id)
                  .indexOf(selectedTransactions[0])
              ].eft_date && (
                <>
                  <h5>Paid in by</h5>
                  <p className="panel-title">
                    {
                      transactions[
                        transactions
                          .map((item) => item.id)
                          .indexOf(selectedTransactions[0])
                      ].eft_date
                    }
                  </p>
                </>
              )}

              <h5>Branch</h5>
              <p className="panel-title">
                {
                  transactions[
                    transactions
                      .map((item) => item.id)
                      .indexOf(selectedTransactions[0])
                  ].transaction_event.bank_account_details.branch
                }
              </p>
            </>
          )}
        </div>
        <div className="col-md-10">
          <Panel
            maximizable
            className="mt-4"
            color="inverse"
            title="Process Direct Cheques"
          >
            <div className="row justify-content-between my-4">
              <div className=" col-md-12">
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
      url: `/events/${context.params.eventId}/finance/reports/transactions?type=CHEQUE`,
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

FinanceDirectCheques.authorized = true;
FinanceDirectCheques.allowedRoles = [ADMIN];
FinanceDirectCheques.Layout = ViewEventLayout;
FinanceDirectCheques.defaultProps = {
  transactions: [],
};

export default FinanceDirectCheques;
