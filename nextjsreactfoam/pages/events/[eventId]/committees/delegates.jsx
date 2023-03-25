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
import DelegateDashboardLayout from "@/components/layouts/DelegateDashboardLayout";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import DelegateCommitteeHeader from "@/components/common/DelegateCommitteeHeader";

const CommitteeDelegates = ({ event, delegates, meta, context }) => {
  const t = useTranslations();
  const delegateDashboardDispatch = useDelegateDashboardDispatch();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "email", label: "Email" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "country", label: "Country" },
    { key: "organisation", label: "Organisation" },
    { key: "registration", label: "Registration" },
    { key: "date_added", label: "Registered" },
  ];

  const scopedSlots = {
    email: (item) => item.user.email,
    first_name: (item) => item.user.first_name,
    last_name: (item) => item.user.last_name,
    country: (item) => item.user.country,
    organisation: (item) => item.user.organisation,
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
    delegateDashboardDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Committee" description={<DelegateCommitteeHeader />} />
      <Panel className="mt-4">
        <div className="row">
          <div className="col-md-6">
            <div className="d-flex">
              <h5>Organisation</h5>
              <Input.Select className="col-md-6 ml-2" />
            </div>
          </div>
          <div className="col-md-6">
            <div className="d-flex">
              <h5>Addon</h5>
              <Input.Select className="col-md-6 ml-2" />
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-6">
            <Button className="mr-2">Preview</Button>
            <Button color="primary">
              <Icon icon="file-o" className="mr-1" />
              Export
            </Button>
          </div>
        </div>
      </Panel>
      <Panel title="Delegates" color="inverse" maximizable collapsable>
        <Table
          items={delegates}
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
      const delegatesResponse = await api({
        url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          delegates: delegatesResponse.data.data,
          meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

CommitteeDelegates.authorized = true;
// CommitteeDelegates.allowedRoles = [];
CommitteeDelegates.Layout = DelegateDashboardLayout;

export default CommitteeDelegates;
