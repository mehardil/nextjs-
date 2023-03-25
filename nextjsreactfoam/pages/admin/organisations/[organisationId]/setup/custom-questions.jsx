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
import { Controller, FormProvider, useForm } from "react-hook-form";
import Panel from "@/components/ui/Panel";
import OrganisationCustomQuestionForm from "@/components/forms/OrganisationCustomQuestionForm";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";

const OrganisationSetupCustomQuestions = ({ organisation }) => {
  const organisationDispatch = useOrganisationDispatch();
  const t = useTranslations();
  const methods = useForm();
  const [isSaving, setIsSaving] = useState(false);

  const pageHeaderToolbar = (
    <Button color="primary" isCircle onClick={() => {}}>
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
        title="Edit Organisation Custom Questions"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <OrganisationCustomQuestionForm
            isSaving={isSaving}
            defaultValues={{}}
          >
            <div className="form-row">
              <div className="form-group col-md-4">
                <Label isRequired>
                  {t("common.membership_category", { entries: 1 })}
                </Label>
                <Controller
                  name="membership_category"
                  control={methods.control}
                  rules={{
                    required: t("errors.forms.required", {
                      field: t("common.membership_category", { entries: 1 }),
                    }),
                  }}
                  render={({ value, onChange }) => (
                    <Input.Select
                      multiple={true}
                      defaultValue={value}
                      placeholder={t("common.membership_category", {
                        entries: 1,
                      })}
                      onChange={(newValue) => onChange(newValue)}
                      feedback={
                        methods.errors.membership_category &&
                        methods.errors.membership_category.message
                      }
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
              <div className="form-group col-md-4">
                <Label isRequired>
                  {t("common.membership_type", { entries: 1 })}
                </Label>
                <Controller
                  name="membership_type"
                  control={methods.control}
                  rules={{
                    required: t("errors.forms.required", {
                      field: t("common.membership_type", { entries: 1 }),
                    }),
                  }}
                  
                  render={({ value, onChange }) => (
                    <Input.Select
                      multiple={true}
                      defaultValue={value}
                      placeholder={t("common.membership_type", { entries: 1 })}
                      onChange={(newValue) => onChange(newValue)}
                      feedback={
                        methods.errors.membership_type &&
                        methods.errors.membership_type.message
                      }
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
              <div className="form-group col-md-4">
                <Label isRequired>
                  {t("common.membership_addon", { entries: 1 })}
                </Label>
                <Controller
                  name="membership_addon"
                  control={methods.control}
                  rules={{
                    required: t("errors.forms.required", {
                      field: t("common.membership_addon", { entries: 1 }),
                    }),
                  }}
                  render={({ value, onChange }) => (
                    <Input.Select
                      multiple={true}
                      defaultValue={value}
                      placeholder={t("common.membership_addon", { entries: 1 })}
                      onChange={(newValue) => onChange(newValue)}
                      feedback={
                        methods.errors.membership_addon &&
                        methods.errors.membership_addon.message
                      }
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
            </div>
          </OrganisationCustomQuestionForm>
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

OrganisationSetupCustomQuestions.Layout = ViewOrganisationLayout;

export default OrganisationSetupCustomQuestions;
