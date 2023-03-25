import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import getContextProps from "@/utils/getContextProps";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import actionTypes from "@/contexts/action-types";
import PageHeader from "@/components/common/PageHeader";
import OrganisationSetupHeader from "@/components/common/OrganisationSetupHeader";
import Panel from "@/components/ui/Panel";
import OrganisationGeneralForm from "@/components/forms/OrganisationGeneralForm/OrganisationGeneralForm";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import OrganisationSetupFinancialForm from "@/components/forms/OrganisationSetupFinancialForm";
import omit from "lodash/omit";
import isPlainObject from "lodash/isPlainObject";
import { useToasts } from "react-toast-notifications";

const OrganisationSetupFinancialDetail = ({ organisation, session }) => {
  const organisationDispatch = useOrganisationDispatch();
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToasts();

  const methods = useForm({
    defaultValues: {
      ...organisation,
    },
  });

  const handleUpdate = async (params) => {
    let requestParams = {};
    const paramValues = omit(params, ["tax_type", "payment_page_text"]);
    if (params.event_dates) {
      requestParams = {
        ...requestParams,
      };
    }
    for (const [key, value] of Object.entries(paramValues)) {
      if (isPlainObject(value)) {
        requestParams = {
          ...requestParams,
          [key]: value.value,
        };
      } else {
        requestParams = {
          ...requestParams,
          [key]: value,
        };
      }
    }
    requestParams = {
      ...requestParams,
      _method: "PUT",
    };
    api({
      url: `organisations/${organisation?.id}`,
      method: "POST",
      data: requestParams,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    })
      .then((res) => {
        addToast("Organisation financial details saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        router.push({
          pathname: paths.ADMIN_ORG_SETUP_MEMBERSHIP_DETAILS,
          query: { organisationId: organisation?.id },
        });
      })
      .catch((err) => {
        addToast("Failed to save organisation financial details.", {
          appearance: "error",
          autoDismiss: true,
        });
      });
  };
  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleUpdate)}
    >
      <Icon icon="save" type="far" className="mr-1" />
      {t("common.forms.saveChanges")}
    </Button>
  );

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <>
      <PageHeader
        title="Edit Organisation"
        toolbar={pageHeaderToolbar}
        description={<OrganisationSetupHeader />}
      />
      <Panel
        title="Edit Organisation Financial & Legal"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <OrganisationSetupFinancialForm />
        </FormProvider>
      </Panel>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/organisations/${context.params.organisationId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: response.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

OrganisationSetupFinancialDetail.Layout = ViewOrganisationLayout;

export default OrganisationSetupFinancialDetail;
