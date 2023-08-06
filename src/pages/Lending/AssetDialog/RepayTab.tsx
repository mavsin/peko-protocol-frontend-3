import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Slider from "rc-slider";
import { toast } from "react-toastify";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import MainInput from "../../../components/form/MainInput";
import { DELAY_TIME, IN_PROGRESS, POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, REGEX_NUMBER_VALID, USDC_CONTRACT_ABI, USDC_CONTRACT_ADDRESS, USDC_DECIMAL } from "../../../utils/constants";
import OutlinedButton from "../../../components/buttons/OutlinedButton";
import FilledButton from "../../../components/buttons/FilledButton";
import MoreInfo from "./MoreInfo";
import { IAsset, IBalanceData, IUserInfo } from "../../../utils/interfaces";

//  ----------------------------------------------------------------------------------------------------

interface IProps {
  asset: IAsset;
  setVisible: Function;
  balanceData?: IBalanceData;
  userInfo?: IUserInfo;
}

//  ----------------------------------------------------------------------------------------------------

export default function RepayTab({ asset, setVisible, balanceData, userInfo }: IProps) {
  const [amount, setAmount] = useState<string>('0')
  const [moreInfoCollapsed, setMoreInfoCollapsed] = useState<boolean>(false)
  const [maxAmount, setMaxAmount] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  //  --------------------------------------------------------------------------

  //  Approve USDC
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_CONTRACT_ABI,
    functionName: 'approve',
    args: [POOL_CONTRACT_ADDRESS, Number(amount) * 10 ** Number(balanceData?.decimals)]
  })
  const { write: approve, data: approveData } = useContractWrite({ ...approveConfig, onError: () => { setLoading(false) } });
  useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      setTimeout(async () => {
        await rePrepareRepay()
        if (repay) {
          repay()
        } else {
          toast.error(errorMessage)
          setLoading(false)
        }
      }, DELAY_TIME)
    },
    onError: (error) => {
      if (error.cause) {
        const errorObject = JSON.parse(JSON.stringify(error.cause))
        if (errorObject.reason) {
          setErrorMessage(errorObject.reason)
          setLoading(false)
          toast.error(errorObject.reason)
        }
      }
    }
  })

  //  Repay
  const { config: repayConfig, refetch: rePrepareRepay } = usePrepareContractWrite({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'repay',
    args: [asset.contractAddress, parseUnits(amount, asset.decimals)],
    value: asset.symbol === 'eth' ? parseEther(`${Number(amount)}`) : parseEther('0'),
    onError: (error) => {
      if (error.cause) {
        const errorObject = JSON.parse(JSON.stringify(error.cause))
        if (errorObject.reason) {
          setErrorMessage(errorObject.reason)
        }
      }
    }
  })
  const { write: repay, data: repayData } = useContractWrite({ ...repayConfig, onError: () => { setLoading(false) } })
  useWaitForTransaction({
    hash: repayData?.hash,
    onSuccess: () => {
      toast.success('Repaid.')
      setLoading(false)
      setVisible(false)
    },
    onError: (error) => {
      const errorObject = JSON.parse(JSON.stringify(error))
      if (errorObject) {
        if (errorObject.cause) {
          if (errorObject.cause.reason) {
            setErrorMessage(errorObject.cause.reason)
            setLoading(false)
            return toast.error(errorObject.cause.reason)
          }
        }

        if (errorObject.shortMessage) {
          setErrorMessage(errorObject.shortMessage)
          setLoading(false)
          return toast.error(errorObject.shortMessage)
        }
      }
    }
  })

  //  --------------------------------------------------------------------------

  const handleAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value.match(REGEX_NUMBER_VALID)) {
      setAmount(value);
    }
  }

  const handleMaxAmount = () => {
    setAmount(Number(maxAmount).toFixed(6))
  }

  const handleHalfAmount = () => {
    setAmount(`${(Number(maxAmount) / 2).toFixed(6)}`)
  }

  const handleSlider = (value: any) => {
    setAmount(`${Number(value * Number(maxAmount) / 100).toFixed(6)}`)
  }

  //  --------------------------------------------------------------------------

  const amountIsValid = useMemo<boolean>(() => {
    const amountInNumber = Number(amount);
    const maxAmountInNumber = Number(maxAmount);
    if (amountInNumber !== 0) {
      if (amountInNumber <= maxAmountInNumber) {
        return true;
      }
    }
    return false;
  }, [amount, maxAmount])

  const amountInNumberType = useMemo<string>(() => {
    if (amount[0] === '0') {
      if (amount[1] !== '.')
        return `${Number(amount)}`
    }
    return amount
  }, [amount])

  //  --------------------------------------------------------------------------

  useEffect(() => {
    if (userInfo) {
      if (asset.symbol === 'eth') {
        setMaxAmount(formatEther(userInfo.ethBorrowAmount + userInfo.ethInterestAmount))
      } else {
        setMaxAmount(formatUnits(userInfo.usdtBorrowAmount + userInfo.usdtInterestAmount, USDC_DECIMAL))
      }
    }
  }, [userInfo, asset])

  //  --------------------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-2">
        <MainInput
          endAdornment={<span className="text-gray-100 uppercase">{asset.symbol}</span>}
          // disabled={asset.symbol === 'usdc' && approveIsLoading ? approveIsSuccess ? true : false : false}
          onChange={handleAmount}
          value={amountInNumberType}
        />

        <div className="flex items-center justify-between">
          <p className="text-gray-500">Max: {Number(maxAmount).toFixed(6)} <span className="uppercase">{asset.symbol}</span></p>
          <div className="flex items-center gap-2">
            <OutlinedButton className="text-xs px-2 py-1" onClick={handleHalfAmount}>half</OutlinedButton>
            <OutlinedButton className="text-xs px-2 py-1" onClick={handleMaxAmount}>max</OutlinedButton>
          </div>
        </div>

        <div className="mt-4 px-2">
          <Slider
            marks={{
              0: '0%',
              25: '25%',
              50: '50%',
              75: '75%',
              100: '100%'
            }}
            className="bg-gray-900"
            railStyle={{ backgroundColor: '#3F3F46' }}
            trackStyle={{ backgroundColor: '#3B82F6' }}
            // disabled={asset.symbol === 'usdc' ? approveIsSuccess ? true : false : false}
            onChange={handleSlider}
            value={Number(amount) / Number(maxAmount) * 100}
          />
        </div>

        {asset.symbol === 'eth' ? (
          <FilledButton
            className="mt-8 py-2 text-base"
            disabled={!repay || !amountIsValid || loading}
            onClick={() => repay?.()}
          >
            {loading ? IN_PROGRESS : "Repay"}
          </FilledButton>
        ) : (
          <FilledButton
            className="mt-8 py-2 text-base"
            disabled={!approve || !amountIsValid || loading}
            onClick={() => {
              if (approve) {
                setLoading(true)
                approve()
              }
            }}
          >
            {loading ? IN_PROGRESS : "Repay"}
          </FilledButton>
        )}

        {moreInfoCollapsed && (
          <MoreInfo />
        )}
      </div>
    </>
  )
}