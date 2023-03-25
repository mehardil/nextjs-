import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { getSession } from "next-auth/client";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";

const YourMemberships = ({
  organisation,
  memberships,
  context,
  session,
  meta,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();

  const columns = [
    { key: "society_name", label: "Society Name" },
    { key: "membership_package", label: "Membership Package" },
    { key: "expiry_date", label: "Expiry Date" },
    { key: "amount_outstanding", label: "Amount Outstanding" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Your Societies" />
      <div className="row mt-5">
        <div className="col-md-12">
          <Panel title="My Memberships" color="inverse" maximizable collapsable>
            <Table items={memberships} columns={columns} />
          </Panel>
        </div>
      </div>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
          memberships: [],
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

YourMemberships.authorized = true;
YourMemberships.Layout = DashboardLayout;

export default YourMemberships;
