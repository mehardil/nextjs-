import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import {
  useForm,
  useFormContext,
  Controller,
  FormProvider,
} from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import SanitizedHTML from "react-sanitized-html";
import { isEmpty, partition } from "lodash";
import ExtrasForm from "@/components/common/ExtrasForm";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Table from "@/components/ui/Table";
import Wizard from "@/components/ui/Wizard2";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import {
  withAuthUser,
  withEvent,
  withEventAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";
import interpolatePath from "@/utils/interpolatePath";

const UnmanagedMembershipFields = ({ eventOrganisation, index }) => {
  const { control, setValue, watch, errors } = useFormContext();
  const watchOrgChecked = watch(
    `unmanaged_memberships[${index}].event_organisation`
  );

  return (
    <div className="form-group">
      <Controller
        name={`unmanaged_memberships[${index}].event_organisation`}
        control={control}
        render={({ name, value, onChange, ...rest }) => {
          return (
            <Input.Checkbox
              defaultChecked={value}
              label={eventOrganisation?.organisation?.long_name}
              value={eventOrganisation?.id}
              onChange={(checked) => {
                if (checked) {
                  setValue(name, eventOrganisation?.organisation.id);
                } else {
                  setValue(name, undefined);
                }
              }}
            />
          );
        }}
      />
      {!!eventOrganisation?.description && (
        <div className="mb-2 ml-4">
          <SanitizedHTML html={eventOrganisation.description} />
        </div>
      )}
      {!!watchOrgChecked && (
        <div className="row">
          <div className="col-md-6">
            {eventOrganisation?.membership_number_required && (
              <div className="pl-4 mt-3">
                <Label isRequired>Membership Number</Label>
                <Controller
                  name={`unmanaged_memberships[${index}].membership_number`}
                  control={control}
                  rules={{
                    required:
                      "Membership number is required for this organisation.",
                  }}
                  render={({ name, value, onChange }) => {
                    return (
                      <Input
                        name={name}
                        defaultValue={value}
                        placeholder="Membership Number"
                        onChange={onChange}
                        feedback={
                          errors?.["unmanaged_memberships"]?.[index]?.[
                            "membership_number"
                          ]?.message
                        }
                      />
                    );
                  }}
                />
              </div>
            )}
            {!!eventOrganisation?.extras?.length && (
              <div className="pl-4 mt-3">
                <ExtrasForm extras={eventOrganisation.extras} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RegisterMembershipPage = ({
  eventOrganisations,
  userMemberships,
  authUser,
  event,
  eventAddonPages,
  tenant,
  headers,
}) => {
  const methods = useForm();
  const { addToast } = useToasts();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser, eventAddonPages);
  const [managedEventOrganisations, unmanagedEventOrganisations] = partition(
    eventOrganisations,
    (evtOrg) => !!evtOrg?.organisation?.managed
  );

  const tableColumns = [
    { key: "organisation", label: "Organisation" },
    { key: "joining_date", label: "Joining Date" },
    { key: "status", label: "Status" },
  ];

  const tableScopedSlots = {
    organisation: (evtOrg) => evtOrg?.organisation?.long_name,
    joining_date: (evtOrg) => {
      const currentMembership = userMemberships.find(
        (membership) => membership?.Organisation == evtOrg.Organisation
      );

      return currentMembership ? currentMembership.joining_date : "--";
    },
    status: (evtOrg) => {
      const currentMembership = userMemberships.find(
        (membership) => membership?.Organisation == evtOrg.Organisation
      );

      return currentMembership ? currentMembership.status : "--";
    },
  };

  const handleSubmit = async (params, { redirectToNextStep }) => {
    if (!isEmpty(params)) {
      try {
        const formData = new FormData();

        if (params.unmanaged_memberships?.length) {
          params.unmanaged_memberships.forEach((membership, index) => {
            if (!!membership.event_organisation) {
              for (const [key, value] of Object.entries(membership)) {
                formData.append(
                  `unmanaged_memberships[${index}][${key}]`,
                  value
                );
              }
            }
          });
        }

        if (params.extras?.length) {
          params.extras.forEach((extra, index) => {
            if (!!extra.answer) {
              for (const [key, value] of Object.entries(extra)) {
                formData.append(`extras[${index}][${key}]`, value);
              }
            }
          });
        }

        const saveMembershipsResponse = await api({
          method: "POST",
          headers: { ...headers, "Content-Type": "multipart/form-data" },
          url: apiPaths.MEMBERSHIPS,
          data: formData,
        });

        addToast("Successfully added memberships", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (e) {


        return;
      }
    }

    redirectToNextStep();
  };

  useEventRegistrationDispatches({ authUser, event, tenant });

  return (
    <FormProvider {...methods}>
      <Wizard
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        <div className="mb-4">
          <h5 className="mb-2 text-success">Managed Memberships</h5>
          <Table
            items={managedEventOrganisations}
            columns={tableColumns}
            scopedSlots={tableScopedSlots}
            hideSearch
            hideColumnSelector
            hidePagination
            hideNumOfEntries
            hideNumOfEntriesSelect
            bordered
          />
        </div>
        {unmanagedEventOrganisations.map((eventOrg, index) => (
          <div className="mb-2">
            <h5 className="mb-2 text-success">Unmanaged Memberships</h5>
            <UnmanagedMembershipFields
              key={index}
              eventOrganisation={eventOrg}
              index={index}
            />
          </div>
        ))}
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [
    withAuthUser,
    withEvent,
    withTenant,
    withEventAddonPages,
  ])(async (context, pipeProps) => {
    const session = await getSession(context);

    if (session) {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      const eventOrganisationsResponse = await api({
        headers,
        url: interpolatePath(apiPaths.EVT_ORGS, {
          eventId: context.query.eventId,
          query: {
            include: "eventExtras,organisation",
          },
        }),
      });

      const userMembershipResponse = await api({
        headers,
        url: interpolatePath(apiPaths.MEMBERSHIPS, {
          query: {
            event: context.query.eventId,
            user: session.user.id,
            include: "organisation",
          },
        }),
      });

      return {
        props: {
          headers,
          session,
          eventOrganisations: eventOrganisationsResponse.data.data,
          userMemberships: userMembershipResponse.data.data,
          ...pipeProps,
        },
      };
    }

    return {
      notFound: true,
    };
  });

RegisterMembershipPage.authorized = true;
RegisterMembershipPage.Layout = RegistrationLayout;

export default RegisterMembershipPage;
