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
import MembershipReconcileCostTable from "@/components/common/MembershipReconcileCostTable";
import MembershipReconcilePaymentTable from "@/components/common/MembershipReconcilePaymentTable";
import SplitPaymentModal from "@/components/modals/SplitPaymentModal";
import Panel from "@/components/ui/Panel";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useForm, FormProvider, Controller } from "react-hook-form";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";

const Delegates = ({ membership, context }) => {
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
    <Button
      color="primary"
      onClick={() => {
        setSplitPaymentModalActive(true);
      }}
    >
      {t("common.forms.fields.createSplitPayment")}
    </Button>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Reconcile" toolbar={pageHeaderToolbar} />
      <Panel title="Payment" color="inverse">
        <Input.Checkbox />
        <h5 className="mb-4 mt-3">Payments, Discounts, and Removals</h5>
        <MembershipReconcilePaymentTable />
        <h5 className="mb-3 mt-3">Costs</h5>
        <MembershipReconcileCostTable />
        <div className="d-flex mt-3">
          <Button className="mr-2" color="primary">
            {t("common.forms.fields.reconcile")}
          </Button>
          <Button>{t("common.forms.fields.clearGroupTransfer")}</Button>
        </div>
      </Panel>
      {splitPaymentModalActive && (
        <SplitPaymentModal
          isShow={splitPaymentModalActive}
          onHide={() => setSplitPaymentModalActive(false)}
        />
      )}
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

Delegates.Layout = ViewOrganisationMembershipLayout;

export default Delegates;
