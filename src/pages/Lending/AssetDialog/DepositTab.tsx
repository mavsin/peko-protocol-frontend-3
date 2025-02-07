import { ChangeEvent, useMemo, useState } from "react";
import Slider from "rc-slider";
import { toast } from "react-toastify";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import MainInput from "../../../components/form/MainInput";
import { APY_DECIMAL, DELAY_TIME, IN_PROGRESS, POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, REGEX_NUMBER_VALID, USDC_CONTRACT_ABI, USDC_CONTRACT_ADDRESS } from "../../../utils/constants";
import OutlinedButton from "../../../components/buttons/OutlinedButton";
import FilledButton from "../../../components/buttons/FilledButton";
import MoreInfo from "./MoreInfo";
import { IAsset, IBalanceData, IPoolInfo, IUserInfo } from "../../../utils/interfaces";

//  ----------------------------------------------------------------------------------------------------

interface IProps {
  asset: IAsset;
  setVisible: Function;
  balanceData?: IBalanceData;
  userInfo?: IUserInfo;
  poolInfo?: IPoolInfo;
}

//  ----------------------------------------------------------------------------------------------------

export default function DepositTab({ asset, setVisible, balanceData, userInfo, poolInfo }: IProps) {
  const [amount, setAmount] = useState<string>('0')
  const [moreInfoCollapsed, setMoreInfoCollapsed] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  //  -----------------------------------------------------

  //  Deposit
  const { config: depositConfig, refetch: rePrepareDeposit } = usePrepareContractWrite({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'deposit',
    args: [asset.contractAddress, parseUnits(amount, asset.decimals)],
    value: asset.symbol === 'eth' ? parseEther(`${Number(amount)}`) : parseEther('0'),
  })
  const { write: deposit, data: depositData } = useContractWrite({ ...depositConfig, onError: () => { setLoading(false) } });
  useWaitForTransaction({
    hash: depositData?.hash,
    onSuccess: () => {
      toast.success('Deposited.');
      setLoading(false)
      setVisible(false);
    },
    onError: () => {
      setLoading(false)
    }
  })

  //  Approve USDC
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_CONTRACT_ABI,
    functionName: 'approve',
    args: [POOL_CONTRACT_ADDRESS, Number(amount) * 10 ** Number(balanceData?.decimals)],
    onError: () => {
      setLoading(false)
    }
  })
  const { write: approve, data: approveData } = useContractWrite({ ...approveConfig, onError: () => { setLoading(false) } });
  useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      setTimeout(async () => {
        await rePrepareDeposit()
        if (deposit) {
          deposit()
        } else {
          toast.warn(`Please approve ${amount} USDC.`)
          setLoading(false)
        }
      }, DELAY_TIME)
    },
    onError: () => {
      toast.error('Approve occurred error.')
      setLoading(false)
    }
  })

  //  -----------------------------------------------------

  const amountIsValid = useMemo<boolean>(() => {
    const amountInNumber = Number(amount);
    const balanceInNumber = Number(balanceData?.formatted);
    if (amountInNumber !== 0) {
      if (amountInNumber <= balanceInNumber) {
        return true;
      }
    }
    return false;
  }, [amount, balanceData?.formatted])

  const depositApyInPercenage = useMemo<number>(() => {
    if (poolInfo) {
      return Number(formatUnits(poolInfo.depositApy, APY_DECIMAL))
    }
    return 0
  }, [poolInfo])

  const amountInNumberType = useMemo<string>(() => {
    if (amount[0] === '0') {
      if (amount[1] !== '.')
        return `${Number(amount)}`
    }
    return amount
  }, [amount])

  //  -----------------------------------------------------

  const handleAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value.match(REGEX_NUMBER_VALID)) {
      setAmount(value);

      e.target.focus();
    }
  }

  const handleSlider = (value: any) => {
    setAmount(`${(value * Number(balanceData?.formatted) / 100).toFixed(6)}`)
  }

  //  -----------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-2">
        <MainInput
          endAdornment={<span className="text-gray-100 uppercase">{asset.symbol}</span>}
          onChange={handleAmount}
          value={amountInNumberType}
        // disabled={asset.symbol === 'usdc' ? approveIsSuccess ? true : false : false}
        />

        <div className="flex items-center justify-between">
          <p className="text-gray-500">Max: {Number(balanceData?.formatted).toFixed(6)} <span className="uppercase">{asset.symbol}</span></p>
          <div className="flex items-center gap-2">
            <OutlinedButton
              className="text-xs px-2 py-1"
              onClick={() => setAmount(`${(Number(balanceData?.formatted) / 2).toFixed(6)}`)}
            >half</OutlinedButton>
            <OutlinedButton
              className="text-xs px-2 py-1"
              onClick={() => setAmount(`${Number(balanceData?.formatted).toFixed(6)}`)}
            >max</OutlinedButton>
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
            value={Number(amount) / Number(balanceData?.formatted) * 100}
            onChange={handleSlider}
          // disabled={asset.symbol === 'usdc' ? approveIsSuccess ? true : false : false}
          />
        </div>

        <div className="flex flex-col gap-2 text-sm mt-8">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Deposited</span>
            <span className="text-gray-100 uppercase">
              {userInfo && balanceData ? asset.symbol === 'eth' ?
                Number(formatEther((userInfo.ethDepositAmount))).toFixed(6) :
                Number(formatUnits(userInfo.usdtDepositAmount, balanceData.decimals)).toFixed(6) : ''}&nbsp;
              {asset.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">APY</span>
            <span className="text-gray-100">{depositApyInPercenage.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Wallet</span>
            <span className="text-gray-100 uppercase">{Number(balanceData?.formatted).toFixed(6)} {asset.symbol}</span>
          </div>
        </div>

        {asset.symbol === 'eth' ? (
          <FilledButton
            className="mt-8 py-2 text-base"
            disabled={!deposit || !amountIsValid || loading}
            onClick={() => {
              if (deposit) {
                setLoading(true)
                deposit()
              }
            }}
          >
            {loading ? IN_PROGRESS : "Deposit"}
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
            {loading ? IN_PROGRESS : 'Deposit'}
          </FilledButton>
        )}

        {moreInfoCollapsed && (
          <MoreInfo />
        )}
      </div>
    </>
  )
}