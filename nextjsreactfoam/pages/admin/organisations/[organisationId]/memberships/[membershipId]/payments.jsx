import React, { useState, useEffect } from "react";
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
import ViewOrganisationMembershipLayout from "@/components/layouts/ViewOrganisationMembershipLayout";
import MembershipTransactionTable from "@/components/common/MembershipTransactionTable";

import TransactionModal from "@/components/modals/TransactionModal";
import Panel from "@/components/ui/Panel";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useForm, FormProvider, Controller } from "react-hook-form";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import MembershipPaymentTable from "@/components/common/EventSponsorPaymentTable";
import MembershipPayment from "@/components/forPage/EventSponsor/EventSponsorPayment";

const transactions = ({ membership, context }) => {
  const t = useTranslations();
  const organisationDispatch = useOrganisationDispatch();
  const [splitPaymentModalActive, setSplitPaymentModalActive] = React.useState(
    false
  );
  const initialNumOfEntries = context.query.perPage;
  const methods = useForm();
  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_MEMBERSHIP,
      payload: membership,
    });
  }, [membership]);
  const pageHeaderToolbar = (
    <Button color="primary">{t("common.forms.saveChanges")}</Button>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Payment" toolbar={pageHeaderToolbar} />

      <Panel title="Payments" color="inverse">
        <h3>Outstanding Invoice Item</h3>
        <p className="my-3">
          All the payments are secured by our payment partner
        </p>
        <MembershipPaymentTable />
      </Panel>
      <MembershipPayment />
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
      //request
      return {
        props: {
          session,
          context: await getContextProps(context),
          membership: {},
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

transactions.Layout = ViewOrganisationMembershipLayout;

export default transactions;
