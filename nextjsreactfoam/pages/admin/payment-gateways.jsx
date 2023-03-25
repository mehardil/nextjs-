import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import isObject from "lodash/isObject";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PaymentGatewayModal from "@/components/modals/PaymentGatewayModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import paymentGateways from "@/constants/paymentGateways";
import withTablePaginationProps from "@/components/hocs/withTablePaginationProps";
import { paymentGatewayOptions } from "@/options";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import requestParamBuilder from "@/utils/requestParamBuilder";
import setDefaultValues, { OPTION } from "@/utils/setDefaultValues";

const PaymentGateways = ({
  paymentGateways,
  context,
  session,
  meta,
  headers,
}) => {
  const { addToast } = useToasts();
  const router = useRouter();
  const t = useTranslations();
  const initialNumOfEntries = context.query.perPage;
  const [paymentGateway, setPaymentGateway] = useState(paymentGateways);
  const [activePaymentGateway, setActivePaymentGateway] = useState();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setShowPaymentGatewayModal(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.paymentGateway", { entries: 1 }),
      })}
    </Button>
  );

  const tableColumns = [
    { key: "id", label: "ID", _style: { width: "3%" } },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "action", label: "Action", _style: { width: "5%" } },
  ];

  const tableRowDropdownOptions = (item) => [
    {
      label: "Delete",
      onClick: () => {
        setActivePaymentGateway(item);
        setShowDeleteConfirm(true);
      },
    },
  ];

  const tableScopedSlots = {
    action: (item) => (
      <div className="d-flex">
        <Button.Dropdown
          size="xs"
          color="white"
          options={tableRowDropdownOptions(item)}
        >
          <Button
            onClick={() => {
              setActivePaymentGateway(item);
              setShowPaymentGatewayModal(true);
            }}
          >
            {t("common.forms.edit")}
          </Button>
        </Button.Dropdown>
      </div>
    ),
  };

  const PaymentGatewaysTable = withTablePaginationProps((props) => (
    <Table
      items={paymentGateway}
      columns={tableColumns}
      initialPage={meta.current_page}
      numOfPages={meta.last_page}
      totalItems={meta.total}
      from={meta.from}
      to={meta.to}
      initialKeyword={context.query.keyword}
      scopedSlots={tableScopedSlots}
      bordered
      {...{ initialNumOfEntries }}
      {...props}
    />
  ));

  const onConfirmPaymentGatewayDelete = async () => {
    try {
      const data = await api({
        method: "DELETE",
        headers,
        url: interpolatePath(apiPaths.PAYMENT_GATEWAY, {
          paymentGatewayId: activePaymentGateway?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activePaymentGateway?.name,
          entity: t("common.paymentGateway", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.push(router);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: activePaymentGateway?.name,
          entity: t("common.paymentGateway", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const onPaymentGatewaySubmit = async (params) => {
    setSaving(true);

    const requestMethod = activePaymentGateway ? "PUT" : "POST";
    const requestParams = requestParamBuilder(params);
    const requestUrl = activePaymentGateway
      ? apiPaths.PAYMENT_GATEWAY
      : apiPaths.PAYMENT_GATEWAYS;
    const notifSuccess = activePaymentGateway
      ? "common.notifs.successfullyUpdated"
      : "common.notifs.successfullyCreated";
    const notifFail = activePaymentGateway
      ? "common.notifs.failedToUpdate"
      : "common.notifs.failedToCreate";

    try {
      const data = await api({
        headers,
        method: requestMethod,
        data: requestParams,
        url: interpolatePath(requestUrl, {
          paymentGatewayId: activePaymentGateway?.id,
        }),
      });

      addToast(
        t(notifSuccess, {
          entityName: params?.name,
          entity: t("common.paymentGateway", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.push(router);
    } catch (e) {
      addToast(
        t(notifFail, {
          entityName: params?.name,
          entity: t("common.paymentGateway", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("common.paymentGateway", { entries: 2 })}
        toolbar={pageHeaderToolbar}
      />
      <Panel
        title={t("common.paymentGateway", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        {showPaymentGatewayModal && (
          <PaymentGatewayModal
            isShow={showPaymentGatewayModal}
            onSubmit={onPaymentGatewaySubmit}
            isSaving={isSaving}
            onHide={() => {
              setShowPaymentGatewayModal(false);
              setActivePaymentGateway(undefined);
            }}
            defaultValues={
              activePaymentGateway
                ? setDefaultValues(activePaymentGateway, {
                    type: { type: OPTION, options: paymentGatewayOptions },
                  })
                : undefined
            }
          />
        )}
        {showDeleteConfirm && (
          <PopupAlert
            danger
            showCancel
            confirmBtnText="Delete"
            type="danger"
            confirmBtnBsStyle="danger"
            title={t("common.forms.deleteConfirmation")}
            focusCancelBtn
            onConfirm={onConfirmPaymentGatewayDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            {t("common.alerts.areYouSureToDelete", {
              entityName: activePaymentGateway?.name,
              entity: t("common.paymentGateway", { entries: 1 }),
            })}
          </PopupAlert>
        )}
        <PaymentGatewaysTable />
      </Panel>
    </>
  );
};
export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    const response = await api({
      headers,
      url: interpolatePath(apiPaths.PAYMENT_GATEWAYS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
        },
      }),
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        paymentGateways: response.data.data,
        meta: response.data.meta,
        headers,
      },
    };
  }

  return {
    props: {},
  };
};
PaymentGateways.authorized = true;
PaymentGateways.allowedRoles = [ADMIN];
PaymentGateways.Layout = DashboardLayout;
PaymentGateways.defaultProps = {
  PaymentGateways: [],
};

export default PaymentGateways;
