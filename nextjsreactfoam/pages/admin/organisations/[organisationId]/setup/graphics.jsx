import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/client";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import getContextProps from "@/utils/getContextProps";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useTranslations } from "next-intl";
import OrganisationSetupHeader from "@/components/common/OrganisationSetupHeader";
import actionTypes from "@/contexts/action-types";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import { FormProvider, useForm } from "react-hook-form";
import Panel from "@/components/ui/Panel";
import OrganisationGraphicsForm from "@/components/forms/OrganisationGraphicsForm";
import { useToasts } from "react-toast-notifications";

const OrganisationSetupGraphics = ({ organisation, session }) => {
  const organisationDispatch = useOrganisationDispatch();
  const t = useTranslations();
  const methods = useForm({ defaultValues: organisation });
  const { addToast } = useToasts();
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (params) => {
    let formData = new FormData();

    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }

    formData.append("_method", "PUT");

    setIsSaving(true);

    try {
      await api({
        url: `organisations/${organisation?.id}`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      addToast("Organisation graphics saved successfully", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      addToast("Failed to save organisation graphics.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleUpdate)}
      isLoading={isSaving}
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
        title="Edit Organisation Graphics"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <OrganisationGraphicsForm />
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

OrganisationSetupGraphics.Layout = ViewOrganisationLayout;

export default OrganisationSetupGraphics;
