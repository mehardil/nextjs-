import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { FormProvider, useForm, Controller } from "react-hook-form";
import SanitizedHTML from "react-sanitized-html";
import { useToasts } from "react-toast-notifications";
import { isEmpty, groupBy } from "lodash";
import ExtrasForm from "@/components/common/ExtrasForm";
import EventAddonCostsForm from "@/components/forms/EventAddonCostsForm";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Alert from "@/components/ui/Alert";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import { useLayoutDispatch } from "@/contexts/LayoutContext";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import Input from "@/components/ui/Input";
import apiPaths from "@/routes/api";
import { createUserRegistrationAddon } from "@/requests/userRegistration";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import {
  withAuthUser,
  withEventAndAddonPages,
  withTenant,
} from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const RegisterAddonsPage = ({
  authUser,
  event,
  eventAddonCosts,
  tenant,
  session,
}) => {
  const router = useRouter();
  const methods = useForm({ defaultValues: { addons: [] } });
  const { addToast } = useToasts();
  const globalDispatch = useGlobalDispatch();
  const layoutDispatch = useLayoutDispatch();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);

  const groupedCosts = eventAddonCosts.reduce((grouped, cost) => {
    const hasAddon = grouped.find((addon) => addon.id == cost.event_addon.id);
    const costAddon = !hasAddon ? cost.event_addon : hasAddon;
    const costsArray = !hasAddon ? [cost] : [...hasAddon.costs, cost];
    return [...grouped, { ...costAddon, costs: costsArray }];
  }, []);

  useEventRegistrationDispatches({ authUser, event, tenant });

  const handleSubmit = async (params, { redirectToNextStep }) => {
    if (!isEmpty(params)) {
      try {
        await createUserRegistrationAddon(
          event?.id,
          params,
          session.accessToken
        );
        addToast("Addon saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (e) {
        addToast("Failed to save addon.", {
          appearance: "error",
          autoDismiss: true,
        });

        return;
      }
    }

    redirectToNextStep();
  };

  return (
    <FormProvider {...methods}>
      <Wizard
        skippable
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        {!eventAddonCosts.length ? (
          <Alert color="warning" classname="w-25">
            No addons currently available for this page. Click Next to proceed.
          </Alert>
        ) : (
          <>
            {groupedCosts.map((addon) => (
              <div key={addon.id} className="form-group mb-5">
                <h5 className="text-success">{addon.name}</h5>
                <p>{addon.description}</p>
                <EventAddonCostsForm costs={addon.costs} />
              </div>
            ))}
          </>
        )}
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEventAndAddonPages, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const eventAddonCostsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_ADDON_COSTS, {
            eventId: pipeProps.event?.id,
            query: {
              eventAddonPage: context.query.addonPageId,
              forUser: pipeProps.authUser.id,
              include: "eventAddon,eventAddon.extras",
            },
          }),
        });

        return {
          props: {
            session,
            eventAddonCosts: eventAddonCostsResponse.data.data,
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

RegisterAddonsPage.authorized = true;
RegisterAddonsPage.Layout = RegistrationLayout;

export default RegisterAddonsPage;
